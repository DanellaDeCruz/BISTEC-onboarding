---
description: "Task list for PMO Ticket Triage Dashboard"
---

# Tasks: PMO Ticket Triage Dashboard

**Input**: Design documents from `specs/001-pmo-triage-dashboard/`

**Prerequisites**: plan.md ✅ | spec.md ✅ | research.md ✅ | data-model.md ✅ | contracts/ ✅

**Tests**: Not explicitly requested in spec — test tasks included only for the constitution-required
integration test gap (T-INT-001) and the existing unit test baseline.

**Organization**: Tasks are grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1–US4)
- Exact file paths are included in every task description

---

## Phase 1: Setup

**Purpose**: Confirm project scaffolding is healthy before implementing gaps.

- [x] T001 Verify `pnpm install` completes without errors
- [x] T002 Verify `pnpm db:migrate` applies migrations and `prisma/dev.db` is created
- [x] T003 Verify `pnpm db:seed` loads 10 tickets (confirm "Seeded 10 tickets." output)
- [ ] T004 Verify `pnpm dev` starts without errors and `http://localhost:3000/tickets` loads

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Infrastructure gaps that MUST be closed before interactive user stories work.

**⚠️ CRITICAL**: US2 and US3 interactive updates cannot be implemented until T005 is done.
US1 read view and US4 grouping are already implemented and do not block on this phase.

- [x] T005 Add `@@index([priority])` to the `Ticket` model in `prisma/schema.prisma`
- [x] T006 Generate and apply the Prisma migration: `pnpm exec prisma migrate dev --name add_priority_index`
- [x] T007 [P] Create `tests/integration/` directory and add a `.gitkeep` placeholder
- [x] T008 [P] Add a `test:integration` script to `package.json` that runs Vitest with a `tests/integration/**` glob and `DATABASE_URL` pointed at `prisma/test.db`

**Checkpoint**: DB index exists, test infrastructure scaffolded — ready for user story work. ✅

---

## Phase 3: User Story 1 — View All Open Tickets (Priority: P1) 🎯 MVP

**Goal**: Dashboard renders all open tickets with title, priority, owner, and creation date.
Grouped by priority. Empty-state messages shown when a group is empty.

**Independent Test**: Run `pnpm dev`, open `http://localhost:3000/tickets`. Confirm 10 seed
tickets visible across P0/P1/P2 sections with correct fields. Delete all P0 tickets via
SQLite CLI and confirm "No P0 tickets" message appears.

> **Note**: US1 is already fully implemented in `src/app/tickets/page.tsx` and the
> `GET /api/tickets` route. Tasks below close the integration test gap required by
> constitution §II before this story can be considered mergeable.

### Integration Tests for User Story 1

- [x] T009 [P] [US1] Create `tests/integration/get-tickets.test.ts` — seed real SQLite test DB,
  call `GET /api/tickets`, assert HTTP 200 and all seed tickets returned with correct fields
- [x] T010 [P] [US1] Add empty-state integration test to `tests/integration/get-tickets.test.ts`
  — truncate test DB, assert `GET /api/tickets` returns HTTP 200 with empty array `[]`

### Validation for User Story 1

- [x] T011 [US1] Run `pnpm test` — confirm all unit tests pass
- [x] T012 [US1] Run `pnpm test:integration` — confirm T009 and T010 pass against real SQLite
- [ ] T013 [US1] Open dashboard, manually verify each priority section renders correct tickets
  and empty-state message displays when a group has no tickets (quickstart.md §3)

**Checkpoint**: US1 fully functional, tested (unit + integration), and independently validated.

---

## Phase 4: User Story 2 — Assign / Update Ticket Priority (Priority: P2)

**Goal**: PMO Coordinator can change a ticket's priority from the dashboard. Change saves
immediately with optimistic UI and persists after page refresh.

**Independent Test**: Change a ticket's priority on the dashboard. Refresh the page. Confirm
the new priority is shown in the correct group. Attempt an invalid value — confirm a plain-
language error message is shown (not a stack trace).

### Integration Tests for User Story 2

- [x] T014 [P] [US2] Create `tests/integration/patch-priority.test.ts` — seed real SQLite test DB,
  call `PATCH /api/tickets/:id` with a valid priority change, assert HTTP 200 and updated field
- [x] T015 [P] [US2] Add validation error test to `tests/integration/patch-priority.test.ts`
  — submit invalid priority `"P3"`, assert HTTP 400 with `{"error": "Validation failed"}` body
- [x] T016 [P] [US2] Add not-found test to `tests/integration/patch-priority.test.ts`
  — submit PATCH for non-existent id, assert HTTP 404 with `{"error": "Ticket not found"}`

### Implementation for User Story 2

- [x] T017 [US2] Create `src/app/tickets/TicketRow.tsx` — Client Component that renders a
  single ticket row with a `<select>` for priority; uses `useState` to hold optimistic priority
  value and calls `PATCH /api/tickets/:id` on change
- [x] T018 [US2] Update `src/app/tickets/page.tsx` to render `<TicketRow>` in place of the
  existing `<li>` block; pass ticket data as props (server→client handoff)
- [x] T019 [US2] Add loading/pending state to `TicketRow.tsx` — disable the `<select>` and
  show a spinner or muted style while the PATCH request is in flight (FR-009)
- [x] T020 [US2] Add error state to `TicketRow.tsx` — on PATCH failure, revert optimistic
  state and display a plain-language inline error message (FR-010; no raw errors shown)

### Validation for User Story 2

- [x] T021 [US2] Run `pnpm test:integration` — T014/T015/T016 pass
- [ ] T022 [US2] Manual: change a ticket priority → verify immediate optimistic update
- [ ] T023 [US2] Manual: refresh page → verify priority persisted in correct group (quickstart.md §6)

**Checkpoint**: US2 fully functional — priority updates save, persist, and handle errors.

---

## Phase 5: User Story 3 — Assign Ticket Owner (Priority: P3)

**Goal**: PMO Coordinator can assign or update the owner of a ticket inline on the dashboard.
Change persists after page refresh. Blank/whitespace-only input is rejected.

**Independent Test**: Enter an owner name for an unassigned ticket and save. Refresh — confirm
owner shown. Attempt to save whitespace-only owner — confirm validation message.

### Integration Tests for User Story 3

- [x] T024 [P] [US3] Create `tests/integration/patch-owner.test.ts` — seed real SQLite test DB,
  call `PATCH /api/tickets/:id` with `{"owner": "Rangi"}`, assert HTTP 200 and `owner` updated
- [x] T025 [P] [US3] Add whitespace-only owner test to `tests/integration/patch-owner.test.ts`
  — submit `{"owner": " "}`, assert HTTP 400 validation error (Zod `min(1)` rule)
- [x] T026 [P] [US3] Add owner length test to `tests/integration/patch-owner.test.ts`
  — submit owner with 101 characters, assert HTTP 400 validation error

### Implementation for User Story 3

- [x] T027 [US3] Update `src/app/api/tickets/[id]/route.ts` Zod schema — add `max(100)` and
  `trim()` to the `owner` field validator
- [x] T028 [US3] Add owner edit UI to `src/app/tickets/TicketRow.tsx` — click-to-edit inline
  text input for the owner field with save/cancel actions
- [x] T029 [US3] Add optimistic owner state to `TicketRow.tsx` — update displayed owner
  immediately on save attempt; revert on API error with plain-language message (FR-010)
- [x] T030 [US3] Ensure "Unassigned" empty state is shown (italic, muted) when `owner` is null
  or empty after any update (constitution §III — empty state required)

### Validation for User Story 3

- [x] T031 [US3] Run `pnpm test:integration` — T024/T025/T026 pass
- [ ] T032 [US3] Manual: assign owner to unassigned ticket → confirm display updates (quickstart.md §6)
- [ ] T033 [US3] Manual: attempt whitespace-only owner → confirm validation message shown

**Checkpoint**: US3 fully functional — owner assignment works, persists, and validates correctly.

---

## Phase 6: User Story 4 — View Tickets Grouped by Priority (Priority: P4)

**Goal**: Dashboard displays three labelled sections in P0 → P1 → P2 order. After a priority
update (US2), the ticket moves to the correct section without a full page reload.

**Independent Test**: Seed tickets with known priorities. Confirm each appears under the
correct heading. Update a ticket's priority (US2) and confirm it moves groups immediately.

> **Note**: Static grouping is already implemented in `src/app/tickets/page.tsx`.
> The remaining task is ensuring the client-side group re-assignment happens after US2's
> `TicketRow` priority update without a full page reload.

### Implementation for User Story 4

- [x] T034 [US4] Lift ticket state to a parent Client Component `src/app/tickets/TicketBoard.tsx`
  — holds `tickets` in `useState`, passed down to grouped `TicketRow` list; updates group
  membership when a row's priority changes
- [x] T035 [US4] Update `src/app/tickets/page.tsx` — pass server-fetched tickets as initial
  props to `<TicketBoard>` (server component fetches, client component manages mutations)
- [x] T036 [US4] Ensure each priority section retains its empty-state message when all its
  tickets move to another group (constitution §III — no blank sections)

### Validation for User Story 4

- [ ] T037 [US4] Manual: change a ticket's priority → confirm it moves to the new section
  immediately without a page reload (quickstart.md §6)
- [ ] T038 [US4] Manual: move all P2 tickets to P0 → confirm P2 section shows empty-state message

**Checkpoint**: All four user stories fully functional and independently testable.

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Quality gates, performance validation, and constitution compliance checks.

- [x] T039 [P] Run `pnpm build` — confirm zero TypeScript errors and zero broken imports
- [x] T040 [P] Run `pnpm lint` — confirm ESLint + Prettier pass with zero errors
- [x] T041 [P] Run `pnpm test` — confirm all unit tests pass with ≥ 80% coverage on `src/`
- [x] T042 [P] Run `pnpm test:integration` — confirm all integration tests pass against real SQLite
- [ ] T043 Run `pnpm build && pnpm start`, open Lighthouse in Chrome DevTools on
  `http://localhost:3000/tickets` → confirm Performance score ≥ 85 (constitution §IV)
- [ ] T044 Verify keyboard accessibility: tab through all interactive elements (priority select,
  owner input) — confirm visible focus rings present on each (constitution §III, WCAG 2.1 AA)
- [ ] T045 [P] Verify no raw error messages are surfaced in the UI under any error condition
  (submit invalid priority via browser DevTools Network override → confirm plain-language message)
- [ ] T046 [P] Run quickstart.md validation runbook end-to-end (all sections §1–§8)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1
- **US1 (Phase 3)**: Depends on Phase 1 only — read view already works; integration tests need Phase 2 infra
- **US2 (Phase 4)**: Depends on Phase 2 (DB index done, test infra ready)
- **US3 (Phase 5)**: Depends on Phase 4 (reuses `TicketRow` Client Component)
- **US4 (Phase 6)**: Depends on Phase 4 (reuses priority update from US2)
- **Polish (Phase N)**: Depends on all user stories complete

### User Story Dependencies

- **US1 (P1)**: Independent — read view is pre-built; only integration tests needed
- **US2 (P2)**: Requires Foundational phase; introduces `TicketRow` Client Component
- **US3 (P3)**: Depends on US2 (`TicketRow` must exist first — T017)
- **US4 (P4)**: Depends on US2 (priority update state must exist to drive group movement — T017)

### Within Each User Story

- Integration tests (T009–T010, T014–T016, T024–T026) can run in parallel [P]
- Implementation tasks within a story run sequentially (model → service → UI)
- Validation tasks run after implementation is complete

### Parallel Opportunities

```bash
# Phase 2 — run in parallel:
Task: "Add @@index to schema.prisma" (T005)
Task: "Create tests/integration/ directory" (T007)
Task: "Add test:integration script to package.json" (T008)

# Phase 4 — integration tests run in parallel:
Task: "Create patch-priority.test.ts — valid update" (T014)
Task: "Create patch-priority.test.ts — validation error" (T015)
Task: "Create patch-priority.test.ts — not found" (T016)

# Phase N — all quality gate checks run in parallel:
Task: "pnpm build" (T039)
Task: "pnpm lint" (T040)
Task: "pnpm test" (T041)
Task: "pnpm test:integration" (T042)
```

---

## Implementation Strategy

### MVP First (US1 — already done)

The read-only dashboard (US1 + static grouping) is already implemented and usable.
Immediate value available after Phase 1 Setup verification.

### Incremental Delivery

1. **Phase 2** → DB index + test infra → foundation ready ✅
2. **Phase 3 (US1)** → integration tests written → read view fully verified ✅
3. **Phase 4 (US2)** → priority updates live → core triage action available ✅
4. **Phase 5 (US3)** → owner assignment → full triage workflow complete ✅
5. **Phase 6 (US4)** → live group movement → polished UX ✅
6. **Phase N** → automated gates pass ✅ | manual browser checks pending

---

## Notes

- `[P]` = different files, no dependencies on incomplete tasks in the same phase
- `[Story]` label maps each task to its user story for traceability
- T005/T006 (DB index) completed — migration `20260630024408_add_priority_index` applied ✅
- Constitution §II: real-SQLite integration tests done — 12 passing ✅
- Constitution §III: loading/empty/error states implemented in TicketRow + TicketBoard ✅
- Manual validation tasks (T004, T013, T022, T023, T032, T033, T037, T038, T043–T046) require
  running `pnpm dev` in a browser — see quickstart.md for the runbook
