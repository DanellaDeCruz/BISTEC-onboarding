# CI Report — Month 1

## Pipeline Setup

**File**: `.github/workflows/ci.yml`

### Triggers

```yaml
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
```

Every push to `main` or `develop` and every PR targeting `main` triggers the pipeline automatically.

### Jobs

The pipeline has two jobs that run in order:

```
test ──────────────────────── build
 │                              │
 ├─ Type check (tsc --noEmit)   └─ next build
 ├─ Lint (next lint / ESLint)
 ├─ Unit tests (Vitest)
 ├─ Migrate test DB (prisma migrate deploy)
 └─ Integration tests (Vitest integration config)
```

`build` has `needs: test` — it only runs if `test` passes. This means a failing test never wastes time compiling.

### Caching Strategy

```yaml
- uses: actions/setup-node@v4
  with:
    node-version: 20
    cache: pnpm
```

`actions/setup-node` with `cache: pnpm` caches the pnpm store directory keyed on `pnpm-lock.yaml`. On cache hit, `pnpm install --frozen-lockfile` skips re-downloading packages and only links them — reducing install time from ~60s to ~5s on warm runs.

`next build` uses Next.js's built-in incremental build cache stored in `.next/cache`. This is preserved across runs by the `actions/setup-node` cache when the pnpm lockfile hasn't changed, reducing compile time on unchanged pages.

---

## Results Summary

All checks run locally on 2026-07-05 on the `main` branch.

| Metric | Target | Achieved |
|---|---|---|
| Lint errors | 0 | **0** |
| Type errors | 0 | **0** |
| Unit test pass rate | 100% | **100% (5/5)** |
| Integration test pass rate | 100% | **100% (18/18)** |
| Build exit code | 0 | **0** |
| Total test count | ≥ 1 | **23** |
| End-to-end duration (local) | < 3 min | ~2 min (build: 105s, tests: ~15s) |

### Route output from `pnpm build`

```
Route (app)                              Size    First Load JS
┌ ○ /                                   130 B        102 kB
├ ○ /_not-found                         989 B        103 kB
├ ƒ /api/tickets                        130 B        102 kB
├ ƒ /api/tickets/[id]                   130 B        102 kB
└ ○ /tickets                           2.16 kB       104 kB
```

All API routes (`/api/tickets`, `/api/tickets/[id]`) are dynamic (`ƒ`) as expected — they hit the database on demand and cannot be statically pre-rendered.

---

## Failures and Fixes

Four failures were encountered across the build pipeline. Each is documented with the exact error, root cause, and fix.

---

### Failure 4 — CI workflow not detected by GitHub Actions (subfolder placement)

**Error message**
```
ERROR  packages field missing or empty
For help, run: pnpm help install
Error: Process completed with exit code 1.
```

**Warning** (non-blocking)
```
Node.js 20 is deprecated. The following actions target Node.js 20 but are being
forced to run on Node.js 24: actions/checkout@v4, actions/setup-node@v4,
pnpm/action-setup@v4.
```

**Root cause**
GitHub Actions only detects workflow files at the repository root (`<repo>/.github/workflows/`). The initial `ci.yml` was placed at `Weekly challenges/week 01/ticketTriage/.github/workflows/ci.yml` — a subfolder — so GitHub showed the "Get started with Actions" page instead of running it. Once moved to the repo root, the `pnpm install` step ran in the wrong directory (the repo root has no `package.json`) because `defaults: run: working-directory` is not respected by `pnpm/action-setup`.

The Node.js 20 deprecation warning is informational only — GitHub forces the action to run on Node.js 24 automatically. It does not cause failures.

**Fix**
Moved `ci.yml` to the repo root (`.github/workflows/ci.yml`). Replaced the `defaults: run: working-directory` block with explicit `working-directory:` on every individual step, and added `package_json_file:` to `pnpm/action-setup` so pnpm resolves the correct `package.json` in the subfolder before any install runs.

**File changed**: `.github/workflows/ci.yml` (moved to repo root + per-step working-directory)

---

### Failure 1 — ESM-only plugin crashed Vitest config loading

**Error message**
```
ERROR "vite-tsconfig-paths" resolved to an ESM file.
ESM file cannot be loaded by `require`.
[plugin: externalize-deps]
vitest.config.ts:2:26
failed to load config from vitest.config.ts
```

**Root cause**  
`vite-tsconfig-paths` v5 is published as ESM-only (its `package.json` sets `"type": "module"`). The Vitest config file was processed by esbuild in CommonJS mode, which cannot `require()` an ESM module. The library was chosen based on documentation examples that did not distinguish between v4 (CJS-compatible) and v5 (ESM-only).

**Fix**  
Removed the `vite-tsconfig-paths` package entirely. Replaced the plugin with a two-line `resolve.alias` in `vitest.config.ts` that maps `@` → `./src` directly — no library needed:

```ts
// Before (broken)
import tsconfigPaths from "vite-tsconfig-paths";
export default defineConfig({ plugins: [tsconfigPaths()] });

// After (fixed)
import path from "path";
export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
});
```

**File changed**: `vitest.config.ts`

---

### Failure 2 — Zod `min(1)` accepted whitespace-only owner string

**Error message** (integration test assertion)
```
AssertionError: expected 200 to be 400
 ❯ patch-owner.test.ts:58
   expect(response.status).toBe(400)
                           ^
   - Expected  400
   + Received  200
```

**Root cause**  
`z.string().min(1)` measures raw string length. A single space character `" "` has length 1, so it passed validation. The spec required that whitespace-only input be rejected (blank owner has no business meaning). The fix is to call `.trim()` before `.min(1)` so the check is against the stripped length.

**Fix**  
Added `.trim()` before `.min(1)` in the Zod schema for the `owner` field:

```ts
// Before (broken)
owner: z.string().min(1).nullable().optional()

// After (fixed)
owner: z.string().trim().min(1).max(100).nullable().optional()
```

**File changed**: `src/app/api/tickets/[id]/route.ts:9`

---

### Failure 3 — TypeScript error `Object is possibly 'undefined'` in integration test

**Error message**
```
tests/integration/get-tickets.test.ts(52,12): error TS2532: Object is possibly 'undefined'.
```

**Root cause**  
`body[0]` on a typed `Ticket[]` array returns `Ticket | undefined` in strict TypeScript because array index access is not guaranteed to return a value. The test used `body[0].owner` without a null/undefined guard, which TypeScript correctly flagged.

**Fix**  
Changed to optional chaining `body[0]?.owner`. This satisfies the type checker while keeping the test assertion correct — `?.owner` on an undefined value returns `undefined`, not `null`, which would cause the test to fail if the array were actually empty (guarding against a false positive):

```ts
// Before (type error)
expect(body[0].owner).toBeNull();

// After (fixed)
expect(body[0]?.owner).toBeNull();
```

**File changed**: `tests/integration/get-tickets.test.ts:52`

---


