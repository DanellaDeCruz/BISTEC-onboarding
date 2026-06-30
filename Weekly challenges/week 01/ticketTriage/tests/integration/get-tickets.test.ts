import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { clearTickets, createTicket, testDb } from "./helpers";
import { Priority } from "../../src/lib/types";
import type { Ticket } from "@prisma/client";

// Route handler — uses real Prisma client pointing to test.db
const { GET } = await import("../../src/app/api/tickets/route");

describe("GET /api/tickets — integration", () => {
  beforeEach(async () => {
    await clearTickets();
  });

  afterAll(async () => {
    await testDb.$disconnect();
  });

  // T009 — happy path: returns all seeded tickets with correct fields
  it("returns HTTP 200 with all tickets", async () => {
    await createTicket({ title: "P0 ticket", priority: Priority.P0 });
    await createTicket({ title: "P1 ticket", priority: Priority.P1, owner: "Alice" });
    await createTicket({ title: "P2 ticket", priority: Priority.P2 });

    const response = await GET();
    expect(response.status).toBe(200);

    const body = (await response.json()) as Ticket[];
    expect(Array.isArray(body)).toBe(true);
    expect(body).toHaveLength(3);
  });

  it("each ticket has all required fields", async () => {
    await createTicket({ title: "Field check", priority: Priority.P1, owner: "Bob" });

    const response = await GET();
    const body = (await response.json()) as Ticket[];

    const ticket = body[0];
    expect(ticket).toHaveProperty("id");
    expect(ticket).toHaveProperty("title", "Field check");
    expect(ticket).toHaveProperty("description");
    expect(ticket).toHaveProperty("priority", Priority.P1);
    expect(ticket).toHaveProperty("owner", "Bob");
    expect(ticket).toHaveProperty("createdAt");
  });

  it("ticket with no owner returns null for owner field", async () => {
    await createTicket({ owner: null });

    const response = await GET();
    const body = (await response.json()) as Ticket[];
    expect(body[0].owner).toBeNull();
  });

  // T010 — empty DB returns empty array, not an error
  it("returns HTTP 200 with empty array when no tickets exist", async () => {
    // clearTickets() called in beforeEach — DB is empty here
    const response = await GET();
    expect(response.status).toBe(200);

    const body = (await response.json()) as Ticket[];
    expect(Array.isArray(body)).toBe(true);
    expect(body).toHaveLength(0);
  });
});
