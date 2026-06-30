# Data Model: PMO Ticket Triage Dashboard

**Phase 1 output** | **Date**: 2026-06-23 | **Plan**: [plan.md](plan.md)

## Entities

### Ticket

Represents a single work item submitted to the PMO for triage.

| Field | Type | Nullable | Constraints | Notes |
|-------|------|----------|-------------|-------|
| `id` | `String` (cuid) | No | Primary key, auto-generated | Globally unique, URL-safe |
| `title` | `String` | No | Non-empty | Short description of the issue |
| `description` | `String` | No | Non-empty | Detailed context for triage |
| `priority` | `String` | No | One of: `P0`, `P1`, `P2` | Enforced at API + TS layer |
| `owner` | `String` | Yes | Max 100 chars when set | Free-text name; null = unassigned |
| `createdAt` | `DateTime` | No | Auto-set on insert | Used for secondary sort |

**State transitions**:
```
priority: P0 ↔ P1 ↔ P2   (any value → any other value via PATCH)
owner:    null → string    (assign)
          string → string  (reassign)
          string → null    (not supported in v1; owner can only be set or updated)
```

### Priority (value object)

Not a separate DB table — enforced as a TypeScript const enum and Zod validation.

| Value | Label | Display order |
|-------|-------|---------------|
| `P0` | Critical | 1st (top) |
| `P1` | High | 2nd |
| `P2` | Normal | 3rd |

---

## Prisma Schema (current + required changes)

```prisma
model Ticket {
  id          String   @id @default(cuid())
  title       String
  description String
  priority    String
  owner       String?
  createdAt   DateTime @default(now())

  @@index([priority])   // ADD: required by constitution §IV (indexed ORDER BY)
}
```

**Change required**: Add `@@index([priority])` — currently missing. Tracked as T-DB-001.

---

## Validation Rules

### On `PATCH /api/tickets/:id`

Enforced by Zod schema in `src/app/api/tickets/[id]/route.ts`:

| Field | Rule | Error message |
|-------|------|---------------|
| `priority` | Optional; if present must be `"P0"`, `"P1"`, or `"P2"` | `"Invalid priority"` |
| `owner` | Optional; if present must be a non-empty string ≤ 100 chars, or `null` | `"Owner must be a non-empty string or null"` |
| Body | At least one field must be present | `"No updatable fields provided"` |
| Body | Must be valid JSON | `"Invalid JSON body"` |

### On display (UI layer)

- Owner `null` renders as italic "Unassigned" — never a blank cell
- Title/description are truncated with CSS (`truncate` / `line-clamp-2`) — no JS truncation

---

## Seed Dataset

10 pre-loaded tickets covering all three priority levels (see `prisma/seed.ts`):

| Priority | Count | Examples |
|----------|-------|---------|
| P0 | 2 | Production DB unreachable, Payment gateway 500s |
| P1 | 4 | SSO exception, Email delay, CSV truncation, Prefs not persisted |
| P2 | 4 | Firefox flicker, Typo, Tooltip misalignment, Pagination reset |

Run: `pnpm db:seed`

---

## Index of Dependent Files

| File | Role |
|------|------|
| `prisma/schema.prisma` | Source of truth for DB schema |
| `src/lib/types.ts` | Priority const enum + `PRIORITIES` tuple |
| `src/app/api/tickets/[id]/route.ts` | Zod validation (consumes `PRIORITIES`) |
| `prisma/seed.ts` | Seed dataset using `Priority` enum |
