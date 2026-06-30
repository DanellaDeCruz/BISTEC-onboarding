# Implementation Plan: PMO Ticket Triage Dashboard

**Branch**: `001-pmo-triage-dashboard` | **Date**: 2026-06-23 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/001-pmo-triage-dashboard/spec.md`

## Summary

Build a lightweight PMO ticket triage dashboard using Next.js 15 App Router (ADR-001) and
Prisma + SQLite (ADR-002). The dashboard renders all open tickets grouped by priority
(P0/P1/P2), allows inline priority and owner updates via REST API, and meets the performance
targets in the spec (1.5 s render, 500 ms data retrieval, 150 ms API p95). The read-only
scaffold is already implemented; remaining work covers interactive update UI, integration
tests over real SQLite, a `priority` index, and Lighthouse validation.

## Technical Context

**Language/Version**: TypeScript 5 (strict mode, zero `any`)

**Primary Dependencies**: Next.js 15 (App Router), React 19, Tailwind CSS 4, Zod 3

**Storage**: Prisma ORM 6 + SQLite (`prisma/dev.db`)

**Testing**: Vitest 3 (unit — mocked DB acceptable); Vitest + real SQLite test DB (integration)

**Target Platform**: localhost, Node.js 20+, pnpm 9+

**Project Type**: Full-stack web application (integrated frontend + API, single deployment)

**Performance Goals**:
- Initial dashboard render ≤ 1.5 s on localhost with seed data
- `GET /api/tickets` ≤ 500 ms
- `PATCH /api/tickets/:id` p95 ≤ 150 ms
- Client interaction visible feedback ≤ 100 ms (optimistic UI)
- Lighthouse Performance ≥ 85 on the `/tickets` route

**Constraints**:
- No authentication (v1 out of scope)
- Single user, no concurrency controls
- TypeScript strict mode + zero `any` enforced in CI
- Bundle size ≤ 200 kB gzipped for the initial route

**Scale/Scope**: Single PMO Coordinator, ~10–50 tickets (seed dataset), localhost

## Constitution Check

*GATE: Must pass before implementation. Re-checked post-design.*

| Principle | Gate | Status |
|-----------|------|--------|
| I. Code Quality — functions ≤ 50 lines, no `any`, no dead code | All handlers and components must pass strict TS with no `any` | ✅ PASS — existing code is clean; Zod infers all types |
| II. Testing Standards — tests required, real DB for integration | Integration tests over real SQLite MUST exist before merge | ⚠️ GAP — unit tests present; integration tests missing → T-INT-001 |
| III. UX Consistency — loading/empty/error states for every data-fetching surface | Priority/owner update UI must show optimistic state (FR-009) and plain-language errors (FR-010) | ⚠️ GAP — read view complete; interactive update client component not yet built → T-UI-001 |
| IV. Performance — indexed queries, Lighthouse ≥ 85 | `priority` column must be indexed; Lighthouse verified post-build | ⚠️ GAP — index not yet in `schema.prisma` → T-DB-001; Lighthouse not validated → T-PERF-001 |

**Gate result**: PASS with tracked gaps. No complexity exceptions required.

## Project Structure

### Documentation (this feature)

```text
specs/001-pmo-triage-dashboard/
├── plan.md              # This file
├── research.md          # Phase 0 — technology decisions
├── data-model.md        # Ticket entity, schema, validation rules
├── quickstart.md        # End-to-end validation guide
├── contracts/
│   └── tickets-api.md   # REST API contract (GET + PATCH)
└── tasks.md             # Phase 2 output (/speckit-tasks — not created here)
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── layout.tsx                    # Root layout + global CSS
│   ├── page.tsx                      # Root → redirects to /tickets
│   ├── globals.css
│   ├── tickets/
│   │   └── page.tsx                  # Server component — ticket dashboard (read + grouped view)
│   └── api/
│       └── tickets/
│           ├── route.ts              # GET /api/tickets — list all open tickets
│           └── [id]/
│               └── route.ts          # PATCH /api/tickets/:id — update priority / owner
├── lib/
│   ├── db.ts                         # Prisma client singleton (hot-reload safe)
│   └── types.ts                      # Priority const enum + PRIORITIES tuple

prisma/
├── schema.prisma                     # Ticket model; index on priority to be added
├── seed.ts                           # 10-ticket seed dataset
└── migrations/                       # Prisma migration history

tests/
├── tickets.test.ts                   # Unit: GET /api/tickets (Vitest, mocked db)
└── integration/
    └── tickets-api.test.ts           # TODO: real-SQLite integration tests (constitution §II)
```

**Structure Decision**: Single Next.js project. App Router collocates server components and
Route Handlers. Interactive update UI will be a Client Component nested inside `tickets/page.tsx`
to keep the server-rendered shell and avoid full SSR for mutations.

## Complexity Tracking

> No constitution violations requiring justification.
> All gaps are implementation tasks tracked in `tasks.md`.
