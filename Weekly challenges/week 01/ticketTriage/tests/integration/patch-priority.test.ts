import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { NextRequest } from "next/server";
import { clearTickets, createTicket, testDb } from "./helpers";
import { Priority } from "../../src/lib/types";
import type { Ticket } from "@prisma/client";

const { PATCH } = await import("../../src/app/api/tickets/[id]/route");

function makePatchRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/tickets/placeholder", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("PATCH /api/tickets/:id — priority — integration", () => {
  beforeEach(async () => {
    await clearTickets();
  });

  afterAll(async () => {
    await testDb.$disconnect();
  });

  // T014 — valid priority update persists and is returned
  it("returns HTTP 200 and updated ticket on valid priority change", async () => {
    const ticket = await createTicket({ priority: Priority.P2 });

    const req = makePatchRequest({ priority: Priority.P0 });
    const response = await PATCH(req, {
      params: Promise.resolve({ id: ticket.id }),
    });

    expect(response.status).toBe(200);
    const body = (await response.json()) as Ticket;
    expect(body.id).toBe(ticket.id);
    expect(body.priority).toBe(Priority.P0);
  });

  it("change persists in the database", async () => {
    const ticket = await createTicket({ priority: Priority.P2 });

    const req = makePatchRequest({ priority: Priority.P1 });
    await PATCH(req, { params: Promise.resolve({ id: ticket.id }) });

    const persisted = await testDb.ticket.findUnique({ where: { id: ticket.id } });
    expect(persisted?.priority).toBe(Priority.P1);
  });

  // T015 — invalid priority value → HTTP 400 validation error
  it("returns HTTP 400 with validation error for invalid priority", async () => {
    const ticket = await createTicket();

    const req = makePatchRequest({ priority: "P3" });
    const response = await PATCH(req, {
      params: Promise.resolve({ id: ticket.id }),
    });

    expect(response.status).toBe(400);
    const body = (await response.json()) as { error: string };
    expect(body.error).toBe("Validation failed");
  });

  // T016 — non-existent ticket id → HTTP 404
  it("returns HTTP 404 for a non-existent ticket id", async () => {
    const req = makePatchRequest({ priority: Priority.P1 });
    const response = await PATCH(req, {
      params: Promise.resolve({ id: "non-existent-id" }),
    });

    expect(response.status).toBe(404);
    const body = (await response.json()) as { error: string };
    expect(body.error).toBe("Ticket not found");
  });
});
