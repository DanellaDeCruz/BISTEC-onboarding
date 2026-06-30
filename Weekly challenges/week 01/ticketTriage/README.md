# Ticket Triage Tool

A lightweight PMO ticket triage dashboard built with Next.js 15, Prisma, SQLite, and Tailwind CSS.

---

## Prerequisites

- Node.js 20+
- pnpm 9+

Install pnpm if you don't have it:

```bash
npm install -g pnpm
```

---

## Installation

```bash
pnpm install
```

---

## Database setup

Create and migrate the SQLite database:

```bash
pnpm db:migrate
```

Seed the database with 10 sample tickets:

```bash
pnpm db:seed
```

---

## Running the project

Start the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) — the root redirects to the `/tickets` dashboard.

---

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/tickets` | Return all tickets as JSON |
| `PATCH` | `/api/tickets/:id` | Update `priority` and/or `owner` |

### PATCH request body

```json
{
  "priority": "P1",
  "owner": "Danella"
}
```

Invalid payloads return HTTP 400 with a structured error body.

---

## Available scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start Next.js development server |
| `pnpm build` | Production build |
| `pnpm start` | Start production server |
| `pnpm typecheck` | Run TypeScript type checking |
| `pnpm lint` | Run ESLint |
| `pnpm test` | Run Vitest smoke tests |
| `pnpm db:migrate` | Run Prisma migrations |
| `pnpm db:seed` | Seed the database |
| `pnpm db:studio` | Open Prisma Studio |

---

## Project structure

```
ticket-triage/
├── prisma/
│   ├── schema.prisma        # Ticket model + Priority enum
│   └── seed.ts              # 10 sample tickets
├── src/
│   ├── lib/
│   │   └── db.ts            # Singleton Prisma client
│   └── app/
│       ├── layout.tsx
│       ├── page.tsx          # Redirects to /tickets
│       ├── globals.css
│       ├── api/
│       │   └── tickets/
│       │       ├── route.ts          # GET /api/tickets
│       │       └── [id]/
│       │           └── route.ts      # PATCH /api/tickets/:id
│       └── tickets/
│           └── page.tsx     # Dashboard grouped by P0/P1/P2
├── tests/
│   └── tickets.test.ts      # Vitest smoke tests
├── .env                     # DATABASE_URL (gitignored in production)
├── .env.example
├── next.config.ts
├── tailwind.config.ts
├── vitest.config.ts
└── tsconfig.json
```

---

## Regenerating the scaffold with Claude Code

This project was scaffolded using Claude Code (Cowork mode) from the spec files in `speckit.yaml` and `Danella-month1-spec.md`.

To regenerate or extend the scaffold:

1. Open Claude Code (or Cowork) in this directory.
2. Upload `speckit.yaml` and `Danella-month1-spec.md`.
3. Prompt:

```
Generate a complete scaffold for the Ticket Triage Tool using the attached spec.
Stack: Next.js 15 App Router, TypeScript strict, Prisma + SQLite, Tailwind.
Implement all files described in speckit.yaml. No TODOs, no any types.
```

Claude will regenerate all files. Re-run migrations and seed afterward:

```bash
pnpm db:migrate
pnpm db:seed
```

---

## Architecture decisions

- **Next.js 15 App Router** — integrated frontend and API routing, minimal infra.
- **Prisma + SQLite** — zero-infra local database with full type safety.
- **Zod** — runtime validation on PATCH requests, structured 400 errors.
- **Vitest** — fast unit/smoke tests with Prisma mocked via `vi.mock`.
