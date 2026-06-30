# Quickstart Validation Guide: PMO Ticket Triage Dashboard

**Phase 1 output** | **Date**: 2026-06-23 | **Plan**: [plan.md](plan.md)

This guide walks through running and manually validating the dashboard end-to-end against
the acceptance criteria in the spec. It is not a test suite — it is a runbook for confirming
the feature works correctly from a PMO Coordinator's perspective.

---

## Prerequisites

- Node.js 20+
- pnpm 9+ (`npm install -g pnpm`)
- No external services required (SQLite is local)

---

## 1. Install and Set Up

```bash
pnpm install
cp .env.example .env          # sets DATABASE_URL=file:./prisma/dev.db
pnpm db:migrate               # runs Prisma migrations
pnpm db:seed                  # loads 10 seed tickets
```

Expected: `Seeded 10 tickets.` printed to terminal.

---

## 2. Start the Development Server

```bash
pnpm dev
```

Open: `http://localhost:3000`

Expected: Browser redirects to `http://localhost:3000/tickets`.

---

## 3. Validate User Story 1 — View All Open Tickets

**Goal**: All 10 seed tickets are visible, each showing title, priority, and owner.

1. Open `http://localhost:3000/tickets`
2. Confirm three priority sections are visible: **P0 — Critical**, **P1 — High**, **P2 — Normal**
3. Confirm each section's ticket count badge matches the seed data (P0: 2, P1: 4, P2: 4)
4. Confirm each ticket row shows: title, description preview, creation date, owner (or "Unassigned")

**Pass criteria**: All 10 tickets displayed with correct grouping and field visibility.

---

## 4. Validate User Story 4 — Grouped by Priority

**Goal**: Tickets appear under the correct priority group; empty sections show an empty-state message.

1. Verify P0 section lists "Production database unreachable" and "Payment gateway returning 500 errors"
2. Verify P2 section lists "Typo in onboarding copy" and others
3. Open the browser console — confirm no errors

**Empty-state check**:
Run `pnpm db:seed` will reset data. To test empty state manually:
```bash
# Use SQLite directly to delete all P0 tickets temporarily
sqlite3 prisma/dev.db "DELETE FROM Ticket WHERE priority = 'P0';"
```
Reload the dashboard. The P0 section should show "No P0 tickets" (not blank, not an error).
Restore: `pnpm db:seed`

**Pass criteria**: Each section renders correctly; empty section shows descriptive message.

---

## 5. Validate the REST API

Use `curl` or any HTTP client (Postman, Insomnia, Bruno).

### 5a. GET /api/tickets

```bash
curl http://localhost:3000/api/tickets
```

Expected: HTTP 200, JSON array of 10 tickets, each with `id`, `title`, `priority`, `owner`,
`createdAt`.

See full contract: [contracts/tickets-api.md](contracts/tickets-api.md)

### 5b. PATCH — Update Priority

```bash
# Capture any ticket id from the GET response, then:
curl -X PATCH http://localhost:3000/api/tickets/<ID> \
  -H "Content-Type: application/json" \
  -d '{"priority": "P0"}'
```

Expected: HTTP 200, ticket JSON with `priority` updated to `"P0"`.

### 5c. PATCH — Assign Owner

```bash
curl -X PATCH http://localhost:3000/api/tickets/<ID> \
  -H "Content-Type: application/json" \
  -d '{"owner": "Rangi"}'
```

Expected: HTTP 200, ticket JSON with `owner` set to `"Rangi"`.

### 5d. PATCH — Validation Error

```bash
curl -X PATCH http://localhost:3000/api/tickets/<ID> \
  -H "Content-Type: application/json" \
  -d '{"priority": "INVALID"}'
```

Expected: HTTP 400, JSON body `{"error": "Validation failed", "details": [...]}`.

### 5e. PATCH — Ticket Not Found

```bash
curl -X PATCH http://localhost:3000/api/tickets/nonexistent-id \
  -H "Content-Type: application/json" \
  -d '{"priority": "P1"}'
```

Expected: HTTP 404, JSON body `{"error": "Ticket not found"}`.

---

## 6. Validate Interactive Update UI (US2 + US3)

> **Note**: The interactive update Client Component is not yet implemented. This section
> describes the expected validation steps once T-UI-001 is complete.

1. On the dashboard, find any ticket row
2. Change the priority dropdown — the badge should update immediately (optimistic UI)
3. Refresh the page — the new priority should persist
4. Click the owner field — enter a name and save
5. Refresh the page — the owner name should persist
6. Attempt to save an owner with only whitespace — a validation message should appear

**Pass criteria**: Changes persist after refresh; optimistic UI updates within 100 ms;
error messages are plain language (no stack traces).

---

## 7. Run the Automated Test Suite

```bash
pnpm test
```

Expected: All tests pass. Current coverage: unit tests for `GET /api/tickets`.

After T-INT-001 is complete:
```bash
pnpm test:integration
```

Expected: Integration tests pass against real SQLite test DB.

---

## 8. Build Validation

```bash
pnpm build
```

Expected: Build exits 0 with no TypeScript errors.

```bash
pnpm lint
```

Expected: ESLint + Prettier pass with no errors.

---

## Performance Spot-Check

After `pnpm build && pnpm start`:

1. Open Chrome DevTools → Network tab
2. Navigate to `http://localhost:3000/tickets`
3. Confirm: Time to first byte (TTFB) + page load ≤ 1.5 s
4. Confirm: `/api/tickets` response time ≤ 500 ms
5. Run Lighthouse in DevTools → Performance score MUST be ≥ 85

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|-------------|-----|
| `DATABASE_URL` missing error | `.env` not created | `cp .env.example .env` |
| Empty dashboard (no tickets) | DB not seeded | `pnpm db:seed` |
| Migration error on first run | Migrations not applied | `pnpm db:migrate` |
| Build fails — type errors | `any` or type mismatch | Check `src/lib/types.ts` imports |
