import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { NextRequest } from "next/server";
import { clearTickets, createTicket, testDb } from "./helpers";
import type { Ticket } from "@prisma/client";

const { PATCH } = await import("../../src/app/api/tickets/[id]/route");

function makePatchRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/tickets/placeholder", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("PATCH /api/tickets/:id — owner — integration", () => {
  beforeEach(async () => {
    await clearTickets();
  });

  afterAll(async () => {
    await testDb.$disconnect();
  });

  // T024 — valid owner assignment persists
  it("returns HTTP 200 and updates owner field", async () => {
    const ticket = await createTicket({ owner: null });

    const req = makePatchRequest({ owner: "Rangi" });
    const response = await PATCH(req, {
      params: Promise.resolve({ id: ticket.id }),
    });

    expect(response.status).toBe(200);
    const body = (await response.json()) as Ticket;
    expect(body.owner).toBe("Rangi");
  });

  it("owner change persists in the database", async () => {
    const ticket = await createTicket({ owner: "Alice" });

    const req = makePatchRequest({ owner: "Bob" });
    await PATCH(req, { params: Promise.resolve({ id: ticket.id }) });

    const persisted = await testDb.ticket.findUnique({ where: { id: ticket.id } });
    expect(persisted?.owner).toBe("Bob");
  });

  // T025 — whitespace-only owner → HTTP 400
  it("returns HTTP 400 for whitespace-only owner", async () => {
    const ticket = await createTicket();

    const req = makePatchRequest({ owner: "   " });
    const response = await PATCH(req, {
      params: Promise.resolve({ id: ticket.id }),
    });

    expect(response.status).toBe(400);
    const body = (await response.json()) as { error: string };
    expect(body.error).toBe("Validation failed");
  });

  // T026 — owner name > 100 chars → HTTP 400
  it("returns HTTP 400 for owner name exceeding 100 characters", async () => {
    const ticket = await createTicket();
    const longName = "a".repeat(101);

    const req = makePatchRequest({ owner: longName });
    const response = await PATCH(req, {
      params: Promise.resolve({ id: ticket.id }),
    });

    expect(response.status).toBe(400);
    const body = (await response.json()) as { error: string };
    expect(body.error).toBe("Validation failed");
  });
});
