# API Contract: Tickets

**Phase 1 output** | **Date**: 2026-06-23 | **Plan**: [../plan.md](../plan.md)

Base URL (localhost): `http://localhost:3000/api`

All request and response bodies are `application/json`.

---

## GET /tickets

Returns all open tickets as a JSON array, ordered by priority ascending then `createdAt`
descending.

### Request

No body or query parameters required.

```
GET /api/tickets
```

### Response — 200 OK

```json
[
  {
    "id": "clx000000000000000000001",
    "title": "Production database unreachable",
    "description": "Primary DB is returning connection timeouts for all regions.",
    "priority": "P0",
    "owner": "Danella",
    "createdAt": "2026-06-01T09:00:00.000Z"
  },
  {
    "id": "clx000000000000000000002",
    "title": "Login page throws unhandled exception",
    "description": "SSO tokens cause a white screen for enterprise users.",
    "priority": "P1",
    "owner": null,
    "createdAt": "2026-06-02T10:00:00.000Z"
  }
]
```

| Field | Type | Notes |
|-------|------|-------|
| `id` | `string` | CUID — unique ticket identifier |
| `title` | `string` | Short issue description |
| `description` | `string` | Detailed context |
| `priority` | `"P0" \| "P1" \| "P2"` | Current priority |
| `owner` | `string \| null` | Assigned owner; `null` = unassigned |
| `createdAt` | ISO 8601 string | UTC timestamp |

### Error responses

| Status | Condition |
|--------|-----------|
| 500 | Unexpected server error (DB unavailable etc.) |

---

## PATCH /tickets/:id

Updates one or both of a ticket's `priority` and `owner` fields. At least one field must be
provided. All provided fields are validated before any write occurs.

### Request

```
PATCH /api/tickets/:id
Content-Type: application/json
```

**Path parameter**: `id` — the CUID of the ticket to update.

**Body** (all fields optional, but at least one required):

```json
{
  "priority": "P1",
  "owner": "Marlon"
}
```

| Field | Type | Rules |
|-------|------|-------|
| `priority` | `"P0" \| "P1" \| "P2"` (optional) | Must be one of the three valid values |
| `owner` | `string \| null` (optional) | Non-empty string ≤ 100 chars, or `null` |

### Response — 200 OK

Returns the full updated ticket object (same shape as the GET array items).

```json
{
  "id": "clx000000000000000000002",
  "title": "Login page throws unhandled exception",
  "description": "SSO tokens cause a white screen for enterprise users.",
  "priority": "P1",
  "owner": "Marlon",
  "createdAt": "2026-06-02T10:00:00.000Z"
}
```

### Error responses

All errors return a structured JSON body — no raw exceptions exposed.

| Status | `error` field | When |
|--------|--------------|------|
| 400 | `"Invalid JSON body"` | Request body is not valid JSON |
| 400 | `"Validation failed"` + `details` array | One or more fields fail Zod validation |
| 400 | `"No updatable fields provided"` | Body is valid JSON but contains no recognised fields |
| 404 | `"Ticket not found"` | `:id` does not match any record |
| 500 | `"Internal server error"` | Unexpected DB or server error |

**Validation error body example**:

```json
{
  "error": "Validation failed",
  "details": [
    {
      "code": "invalid_enum_value",
      "path": ["priority"],
      "message": "Invalid enum value. Expected 'P0' | 'P1' | 'P2', received 'P3'"
    }
  ]
}
```

---

## Notes

- There is no `POST /tickets` endpoint in v1 — ticket creation is out of scope.
- There is no `DELETE /tickets/:id` endpoint in v1.
- No authentication header is required.
- The `id` field is immutable and cannot be updated via PATCH.
- The `createdAt` field is immutable and cannot be updated via PATCH.
