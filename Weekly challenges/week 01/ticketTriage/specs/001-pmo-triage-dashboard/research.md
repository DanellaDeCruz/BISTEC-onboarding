# Research: PMO Ticket Triage Dashboard

**Phase 0 output** | **Date**: 2026-06-23 | **Plan**: [plan.md](plan.md)

## Framework Choice (ADR-001)

**Decision**: Next.js 15 App Router

**Rationale**: Integrated server rendering + API routes in a single deployment artifact.
App Router enables React Server Components for the ticket list (zero client JS for reads)
while allowing selective Client Components for interactive update controls.

**Alternatives considered**:
- React + Express: rejected — two separate processes, more boilerplate, harder to deploy
- Remix: rejected — smaller ecosystem, less organizational familiarity

**Impact on design**:
- Dashboard page (`tickets/page.tsx`) is a Server Component — reads DB directly, no fetch overhead
- Update controls will be Client Components using `fetch` against `/api/tickets/:id`
- Route Handlers (`app/api/`) provide the REST layer consumed by both client and external tests

---

## Data Layer (ADR-002)

**Decision**: Prisma ORM 6 + SQLite

**Rationale**: Zero infrastructure for local development, type-safe DB access generated from
`schema.prisma`, built-in migration system. SQLite is appropriate for a single-user localhost tool.

**Alternatives considered**:
- PostgreSQL: rejected — requires provisioning, unnecessary for single-user local tool
- Raw SQLite driver (`better-sqlite3`): rejected — manual query management, no type safety

**Impact on design**:
- Prisma Client is a singleton in `src/lib/db.ts` (hot-reload safe via `globalThis` guard)
- SQLite does not support native Prisma enums → Priority is a `String` column + TS-layer const enum
- Integration tests MUST use a separate SQLite test DB (not the dev DB) per constitution §II

---

## Priority Enforcement Strategy

**Decision**: `String` column in SQLite + TypeScript const enum + Zod validation at API boundary

**Rationale**: SQLite lacks native enum support. Enforcing at the API boundary via Zod
(`z.enum(PRIORITIES)`) provides the same guarantees as a DB enum for a single-server app.

**Source of truth**: `src/lib/types.ts` — `PRIORITIES = ["P0", "P1", "P2"] as const`
Zod schema in `[id]/route.ts` consumes `PRIORITIES` directly, keeping both in sync.

---

## Interactive Update UI Pattern

**Decision**: Client Component with optimistic state updates using React `useState` + `fetch`

**Rationale**: Priority dropdowns and owner inputs require client-side interactivity.
Using a thin Client Component wrapper around the server-rendered row avoids hydrating the
entire page. Optimistic UI (update state immediately, revert on error) satisfies FR-009 and
the constitution's 100 ms client feedback requirement.

**Alternatives considered**:
- Server Actions: viable but adds implicit coupling; explicit `fetch` to Route Handlers is
  more testable and aligns with the existing API contract
- Full page revalidation on save: rejected — does not meet the 100 ms feedback requirement

---

## Testing Strategy

**Decision**: Two-layer test approach

| Layer | Tool | DB | Location |
|-------|------|----|----------|
| Unit | Vitest | Mocked (`vi.mock`) | `tests/*.test.ts` |
| Integration | Vitest | Real SQLite test DB | `tests/integration/*.test.ts` |

**Rationale**: Unit tests are fast and catch logic errors in handlers/components.
Integration tests over real SQLite catch query errors and schema drift — constitution §II
explicitly prohibits mocking the DB in integration tests.

**Test DB setup**: Use a separate `DATABASE_URL` env var pointing to `prisma/test.db`.
Seed with known fixtures before each test suite; truncate after.

---

## Performance Strategy

**Decision**: Server-rendered list + DB index on `priority` column

**Rationale**: Next.js RSC means the ticket list HTML is generated server-side with a single
DB query — no client waterfall. Adding `@@index([priority])` in `schema.prisma` ensures
`ORDER BY priority` is covered by an index at any realistic ticket volume.

**Lighthouse target (≥ 85)**: Achievable with RSC (no large JS bundle for the list page),
Tailwind's purged CSS output, and lazy-loading any future non-critical components.

---

## Resolved Unknowns from Spec

| Unknown | Resolution |
|---------|------------|
| How are priority updates reflected without full reload? | Client Component with optimistic `useState` |
| How are integration tests isolated from dev data? | Separate `test.db`, seeded per suite |
| Does `priority` need a DB index? | Yes — `@@index([priority])` to be added to `schema.prisma` |
| Owner validation — max length? | 100 characters (reasonable upper bound, enforced via Zod `max(100)`) |
