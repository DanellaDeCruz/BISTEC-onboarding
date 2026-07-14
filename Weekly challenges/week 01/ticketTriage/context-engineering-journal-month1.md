# Context Engineering Journal — Month 1

| Artefact | Status | Location |
|---|---|---|
| `GET /api/tickets` — returns all tickets ordered by priority | ✅ | `src/app/api/tickets/route.ts` |
| `POST /api/tickets` — creates ticket, Zod-validated, HTTP 201/400 | ✅ | `src/app/api/tickets/route.ts` |
| `PATCH /api/tickets/:id` — updates priority/owner, Zod-validated, HTTP 200/400/404 | ✅ | `src/app/api/tickets/[id]/route.ts` |
| Named migration: `20260630024408_add_priority_index` (from ADR-001) | ✅ | `prisma/migrations/` |
| Unit tests — 5 passing | ✅ | `tests/tickets.test.ts` |
| Integration tests — 18 passing across 4 files | ✅ | `tests/integration/` |
| GitHub Actions CI — lint → typecheck → unit → integration → build | ✅ | `.github/workflows/ci.yml` |


## 1. Prompt Strategy

Which files were attached to each speckit command, and why.

| Command | Files attached | Rationale |
|---|---|---|
| `/speckit-constitution` | `tailwind.config.ts`, `README.md` | Constitution needed the actual tech stack to write enforceable constraints — e.g. "Tailwind design tokens" requires knowing the project uses Tailwind. |
| `/speckit-specify` | `Danella-month1-spec.md`, `Danella-month1-context-notes.md` | The full PRD was required; the context-notes template was attached by mistake (see Pair 3 — it added noise with zero signal). |
| `/speckit-plan` | `Danella-month1-spec.md`, `ticketTriage/` (repo) | The plan phase needed the ADRs (inside month1-spec.md) plus the live repo layout so the generated project structure matched actual files on disk. |
| `/speckit-tasks` | *(no extra files)* | All required design artefacts (plan, spec, data-model, contracts) were already in context from the previous command chain — re-attaching would have been redundant. |
| `/speckit-implement` | *(no extra files)* | Implementation reads every source file directly via tool calls before writing, so pre-attaching files would have duplicated reads and inflated the context window. |

---

## 2. Failure Modes

Specific failures encountered during the session, with the exact missing context that caused them.

> **Location**: `vitest.config.ts:2` — `import tsconfigPaths from "vite-tsconfig-paths"`

### F-1 · Zod min(1) passes a single space

`z.string().min(1)` counts whitespace characters. The owner field accepted `" "` (one space) as valid, contradicting FR-010 ("user-friendly validation") and the spec edge case "What happens if the user attempts to save an owner with only whitespace?" The missing context was the Zod documentation for string transforms — `.trim()` must precede length validators.

> **Location**: `src/app/api/tickets/[id]/route.ts:9` — `owner: z.string().min(1)`

### F-2 · Transitive @types/babel__generator not installed

`pnpm build` (Next.js type-check phase) failed with "Cannot find type definition file for 'babel__generator'". The indirect dependency chain `@vitejs/plugin-react → @babel/core → @types/babel__core` requires `@types/babel__generator` which was absent from `node_modules`. The missing context was the full dependency graph; only direct deps in `package.json` were inspected.

> **Location**: `package.json` — devDependencies missing `@types/babel__generator`

### F-4 · ESLint FlatCompat circular JSON serialisation

Using `FlatCompat` to adapt `next/core-web-vitals` into the flat config format produced a circular-reference crash when Next.js tried to serialise the config object. The `eslint-config-next` plugin attaches React-plugin state that cannot be JSON-cloned. Missing context: the incompatibility between FlatCompat and Next.js 15's internal lint runner, documented only in Next.js GitHub issues, not in the official ESLint migration guide.

> **Location**: `eslint.config.mjs:7` — `compat.extends("next/core-web-vitals")`

---

## 3. Re-Prompt Examples

### Pair 1 · Zod validation — Whitespace string bypassed owner validation

The integration test for a whitespace-only owner name expected HTTP 400 but received 200, because `min(1)` counts the space character as a valid character.

**Before — failing agent output**

```typescript
// src/app/api/tickets/[id]/route.ts
const patchSchema = z.object({
  priority: z.enum(PRIORITIES).optional(),
  owner: z.string().min(1).nullable().optional(),
});

// Integration test result:
// AssertionError: expected 200 to be 400
//  ❯ patch-owner.test.ts:58
//    expect(response.status).toBe(400)
//                            ^
//    - Expected  400
//    + Received  200
```

**After — corrected output**

```typescript
// src/app/api/tickets/[id]/route.ts
const patchSchema = z.object({
  priority: z.enum(PRIORITIES).optional(),
  owner: z.string()
           .trim()      // strips whitespace first
           .min(1)
           .max(100)
           .nullable()
           .optional(),
});

// Integration test result:
// ✓ patch-owner.test.ts (4 tests) 83ms
```

**Commentary**: No new files were needed — the re-prompt was "The whitespace test is failing. Zod's `min(1)` passes a single space. Add `.trim()` before `.min(1)` in the owner validator at `src/app/api/tickets/[id]/route.ts:9`." Pointing to the exact line number and naming the Zod method eliminated an otherwise open-ended diagnosis loop.

| Metric | Before | After |
|---|---|---|
| Failing tests | 1 | 0 |
| Integration tests passing | — | 12 / 12 |
| Lines changed | — | 1 |

---

### Pair 2 · ESM compatibility — vite-tsconfig-paths crashed Vitest config loading

The agent initially used the standard plugin import in the Vitest config, which esbuild refused to bundle because the package is ESM-only in a CommonJS host.

**Before — failing agent output**

```typescript
// vitest.config.ts
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  ...
});

// pnpm test output:
// ERROR "vite-tsconfig-paths" resolved to an
// ESM file. ESM file cannot be loaded by
// `require`.
// [plugin: externalize-deps]
// vitest.config.ts:2:26
// failed to load config from vitest.config.ts
```

**After — corrected output**

```typescript
// vitest.config.ts
import path from "path"; // CJS-safe

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // no plugins array needed
  ...
});

// pnpm test output:
// ✓ tests/tickets.test.ts (5 tests)
// Test Files  1 passed
// Tests       5 passed
```

**Commentary**: The re-prompt attached nothing new — instead it *removed* information. I told the agent: "Don't use the `vite-tsconfig-paths` plugin. The tsconfig paths key is just `"@/*": ["./src/*"]` — wire it directly as a `resolve.alias`." Replacing a library-based solution with a two-line alias was both simpler and ESM-safe. **Less context, better result.**

| Metric | Before | After |
|---|---|---|
| Tests able to run | 0 | 5 / 5 |
| Dependencies | — | −1 removed |

---

### Pair 3 · Context reduction (less context → better result) — Attaching an empty template file confused the spec output

Two files were attached to `/speckit-specify`: the full PRD (`Danella-month1-spec.md`) and an empty scaffold (`Danella-month1-context-notes.md`). Both had identical top-level headings. The agent had to infer which was authoritative.

**Before — original prompt (two files)**

```
@Danella-month1-context-notes.md
@Danella-month1-spec.md
/speckit-specify Build this dashboard
according to the specified ADRs and
non functional requirements

// context-notes.md contained:
// # Ticket Triage Tool — PRD
// ## 1. Persona
// - Primary user, context, pain point
// ## 2. Problem Statement
// - What breaks today, who is affected...
// (empty placeholder template — no content)
```

**After — tighter prompt (one file)**

```
@Danella-month1-spec.md
/speckit-specify Build this dashboard
according to the specified ADRs and
non functional requirements

// context-notes.md NOT attached —
// it was an empty template with the
// same headings as the real spec,
// contributing zero signal and
// forcing the agent to reconcile
// two structurally identical files.
```

**Commentary**: Dropping `Danella-month1-context-notes.md` from the context removed ~300 tokens of empty-template noise. The file had the exact same section headers as the real PRD but no content, creating an ambiguous "which one is the real spec?" decision for the model. Single source of truth — one file, one authority — is cleaner than hedging with a redundant attachment.

| Metric | Before | After |
|---|---|---|
| Files attached | 2 | 1 |
| Tokens saved | — | ~300 |
| Ambiguous authority signals | 1 | 0 |

---

## 4. Summary

Patterns extracted from this month's work, ranked by impact on output quality.

| Pattern | Observed behaviour | Rule going forward | Status |
|---|---|---|---|
| **Single authoritative source** | Two files with identical headings but different content caused the agent to hedge between them (Pair 3). | Attach exactly one file per concern. Never attach a template alongside its filled-in version. | ✅ Applied |
| **Exact file + line in re-prompts** | Vague re-prompts ("fix the validation") produced extra diagnosis turns; line-specific re-prompts ("route.ts:9 add .trim()") resolved in one turn (Pair 1). | Re-prompts must name the file path and line number. Diagnosis is my job, not the agent's. | ✅ Applied |
| **Library vs. inline solution** | Agent defaulted to a library (`vite-tsconfig-paths`) where a two-line alias would do (Pair 2). | Before accepting a library-based solution, check if the underlying need is satisfiable with a one-liner. Less surface area = fewer failure modes. | ✅ Applied |
| **Transitive dependency blindness** | The agent scanned only direct `devDependencies` for type issues, missing the indirect `@babel` chain (F-3). | Before build validation, run `pnpm why <pkg>` to surface what actually requires each types package. | ⏳ Pending |
| **Context attached at the right phase** | Attaching the PRD to `/speckit-implement` would have been wasteful — implementation reads files directly. Attaching the repo to `/speckit-specify` was unnecessary — spec is technology-agnostic. | Match context payload to the command's actual need. Constitution and spec work from requirements; plan and implement work from code. | ✅ Applied |
