<!--
## Sync Impact Report

**Version change**: unversioned → 1.0.0
**Bump rationale**: MAJOR — first concrete constitution replacing blank template

**Principles added**:
- I. Code Quality
- II. Testing Standards
- III. User Experience Consistency
- IV. Performance Requirements

**Sections added**:
- Core Principles
- Quality Gates
- Governance

**Templates updated**:
- `.specify/templates/plan-template.md` ✅ Constitution Check section already present; gates align with principles
- `.specify/templates/spec-template.md` ✅ Success Criteria section supports measurable performance targets
- `.specify/templates/tasks-template.md` ✅ Polish phase includes performance, security, testing tasks

**Deferred TODOs**:
- TODO(RATIFICATION_DATE): Exact adoption date unknown; using today (2026-06-23) as ratification date.
-->

# Ticket Triage Constitution

## Core Principles

### I. Code Quality

Every code change MUST leave the codebase cleaner than it found it. Specifically:

- Functions MUST have a single, well-named responsibility. No function longer than 50 lines.
- Magic numbers or strings MUST be extracted into named constants.
- Dead code, unused imports, and commented-out blocks MUST NOT be committed.
- All TypeScript code MUST pass strict type-checking with no `any` escapes unless explicitly
  justified with an inline comment citing the reason.
- Dependencies MUST be kept minimal; every new package addition requires a stated rationale
  in the PR description.

**Rationale**: A low-maintenance codebase reduces onboarding friction and defect rate. Discipline
at the micro level (naming, size, types) prevents compounding complexity over time.

### II. Testing Standards

- Every new feature or bug fix MUST include a test that would have caught the defect or
  validates the happy path.
- Unit tests MUST be colocated with the module they test (e.g., `foo.test.ts` beside `foo.ts`).
- Integration tests covering database queries or API routes MUST live under `tests/integration/`.
- Tests MUST NOT rely on execution order; each test MUST be independently runnable.
- Mocking of the database is PROHIBITED in integration tests; tests MUST use a real SQLite
  test database seeded from fixtures.
- The full test suite MUST pass (`pnpm test`) before any PR is merged.
- Target: ≥ 80% line coverage on all `src/` modules (enforced in CI).

**Rationale**: Reliable tests are the safety net that enables refactoring and confident delivery.
Banning DB mocks prevents the class of mock/prod divergence bugs that silently pass CI.

### III. User Experience Consistency

- All UI components MUST follow the established Tailwind design tokens (colors, spacing, type
  scale) defined in `tailwind.config.ts`. Raw hex colors or pixel values MUST NOT be hardcoded
  in component files.
- Every interactive element (button, link, filter, modal) MUST have a visible focus style for
  keyboard accessibility (WCAG 2.1 AA compliance).
- Loading states, empty states, and error states MUST be explicitly handled for every data-
  fetching surface. "Undefined" or blank screens are not acceptable defaults.
- User-facing error messages MUST be written in plain language (no stack traces or technical
  identifiers surfaced in the UI).
- Destructive or irreversible actions MUST require explicit user confirmation.

**Rationale**: Ticket triage is used under time pressure by PMO staff. Inconsistent UI or
silent failures slow triage workflows and erode trust in the tool.

### IV. Performance Requirements

- Server-side page responses MUST complete in ≤ 300 ms at p95 under normal load (single user,
  development database).
- Database queries MUST use indexed columns for all WHERE and ORDER BY clauses on ticket tables;
  full-table scans are PROHIBITED on tables with > 100 rows.
- Client-side interactions (filter, sort, status update) MUST produce visible feedback within
  100 ms; network-dependent updates MUST show an optimistic UI state immediately.
- Bundle size for the initial route MUST NOT exceed 200 kB (gzipped). Lazy-load non-critical
  components.
- Lighthouse Performance score MUST remain ≥ 85 on the dashboard route after each release.

**Rationale**: A slow triage tool is an unused triage tool. These thresholds are achievable with
Next.js App Router + SQLite and must be maintained as features are added.

## Quality Gates

Before any PR may be merged, ALL of the following MUST be satisfied:

1. `pnpm build` exits 0 (no TypeScript errors, no broken imports).
2. `pnpm test` exits 0, with coverage ≥ 80% on `src/`.
3. `pnpm lint` exits 0 (ESLint + Prettier).
4. No new `any` types without inline justification comment.
5. Lighthouse Performance ≥ 85 verified on the dashboard route (manual or CI step).
6. All UI states (loading / empty / error) confirmed present for any new data-fetching component.

Complexity exceptions — if a principle must be violated, the PR description MUST include:
- Which principle is violated and why.
- Why the simpler alternative was insufficient.
- A follow-up issue filed to resolve the violation.

## Governance

This constitution supersedes all other coding conventions or informal practices for the
Ticket Triage project. Amendments require:

1. A written proposal describing the changed principle and motivation.
2. Review and approval by the project lead.
3. A migration plan if existing code violates the amended principle.

All PRs and code reviews MUST verify compliance with these principles. Any principle that
cannot be met in a given context MUST be explicitly documented in the Complexity Tracking
section of the feature's `plan.md`.

**Versioning policy**: MAJOR for principle removal or redefinition; MINOR for new principle
or section; PATCH for clarifications and wording.

**Version**: 1.0.0 | **Ratified**: 2026-06-23 | **Last Amended**: 2026-06-23
