import { describe, it, expect, vi, beforeEach } from "vitest";
import { Priority } from "../src/lib/types";
import type { Ticket } from "@prisma/client";

// ---------------------------------------------------------------------------
// Fake ticket fixtures
// ---------------------------------------------------------------------------
const fakeTickets: Ticket[] = [
  {
    id: "clx000000000000000000001",
    title: "Production database unreachable",
    description: "Primary DB is returning connection timeouts.",
    priority: Priority.P0,
    owner: "Danella",
    createdAt: new Date("2026-06-01T09:00:00Z"),
  },
  {
    id: "clx000000000000000000002",
    title: "Login page throws unhandled exception",
    description: "SSO tokens cause a white screen for enterprise users.",
    priority: Priority.P1,
    owner: null,
    createdAt: new Date("2026-06-02T10:00:00Z"),
  },
  {
    id: "clx000000000000000000003",
    title: "Typo in onboarding copy",
    description: "Step 3 reads 'Wellcome' instead of 'Welcome'.",
    priority: Priority.P2,
    owner: null,
    createdAt: new Date("2026-06-03T11:00:00Z"),
  },
];

// ---------------------------------------------------------------------------
// Mock the Prisma singleton before importing the route handler
// ---------------------------------------------------------------------------
vi.mock("../src/lib/db", () => ({
  db: {
    ticket: {
      findMany: vi.fn().mockResolvedValue(fakeTickets),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

const { GET } = await import("../src/app/api/tickets/route");

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe("GET /api/tickets", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns HTTP 200", async () => {
    const response = await GET();
    expect(response.status).toBe(200);
  });

  it("returns a JSON array", async () => {
    const response = await GET();
    const body: unknown = await response.json();
    expect(Array.isArray(body)).toBe(true);
  });

  it("returns the expected number of tickets", async () => {
    const response = await GET();
    const body = (await response.json()) as Ticket[];
    expect(body).toHaveLength(fakeTickets.length);
  });

  it("each ticket has required fields", async () => {
    const response = await GET();
    const body = (await response.json()) as Ticket[];
    for (const ticket of body) {
      expect(ticket).toHaveProperty("id");
      expect(ticket).toHaveProperty("title");
      expect(ticket).toHaveProperty("priority");
      expect(["P0", "P1", "P2"]).toContain(ticket.priority);
    }
  });

  it("all three priorities are represented", async () => {
    const response = await GET();
    const body = (await response.json()) as Ticket[];
    const priorities = new Set(body.map((t) => t.priority));
    expect(priorities.has(Priority.P0)).toBe(true);
    expect(priorities.has(Priority.P1)).toBe(true);
    expect(priorities.has(Priority.P2)).toBe(true);
  });
});
