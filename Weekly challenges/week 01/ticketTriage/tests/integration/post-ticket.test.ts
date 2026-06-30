import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { NextRequest } from "next/server";
import { clearTickets, testDb } from "./helpers";
import { Priority } from "../../src/lib/types";
import type { Ticket } from "@prisma/client";

const { POST } = await import("../../src/app/api/tickets/route");

function makePostRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/tickets", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/tickets — integration", () => {
  beforeEach(async () => {
    await clearTickets();
  });

  afterAll(async () => {
    await testDb.$disconnect();
  });

  // AC: valid payload → HTTP 201 + persisted ticket
  it("returns HTTP 201 and the created ticket", async () => {
    const req = makePostRequest({
      title: "New ticket",
      description: "Something broke",
      priority: Priority.P0,
    });

    const response = await POST(req);
    expect(response.status).toBe(201);

    const body = (await response.json()) as Ticket;
    expect(body).toHaveProperty("id");
    expect(body.title).toBe("New ticket");
    expect(body.priority).toBe(Priority.P0);
  });

  it("persists the ticket in the database", async () => {
    const req = makePostRequest({
      title: "Persisted ticket",
      description: "Check persistence",
      priority: Priority.P1,
    });

    const response = await POST(req);
    const body = (await response.json()) as Ticket;

    const stored = await testDb.ticket.findUnique({ where: { id: body.id } });
    expect(stored).not.toBeNull();
    expect(stored?.title).toBe("Persisted ticket");
  });

  it("defaults priority to P1 when omitted", async () => {
    const req = makePostRequest({
      title: "No priority",
      description: "Should default to P1",
    });

    const response = await POST(req);
    expect(response.status).toBe(201);
    const body = (await response.json()) as Ticket;
    expect(body.priority).toBe(Priority.P1);
  });

  // Named failure mode: missing required field → HTTP 400
  it("returns HTTP 400 when title is missing", async () => {
    const req = makePostRequest({
      description: "No title provided",
      priority: Priority.P1,
    });

    const response = await POST(req);
    expect(response.status).toBe(400);
    const body = (await response.json()) as { error: string };
    expect(body.error).toBe("Validation failed");
  });

  // Named failure mode: whitespace-only title → HTTP 400
  it("returns HTTP 400 for whitespace-only title", async () => {
    const req = makePostRequest({
      title: "   ",
      description: "Whitespace title",
      priority: Priority.P1,
    });

    const response = await POST(req);
    expect(response.status).toBe(400);
    const body = (await response.json()) as { error: string };
    expect(body.error).toBe("Validation failed");
  });

  // Named failure mode: invalid priority value → HTTP 400
  it("returns HTTP 400 for invalid priority", async () => {
    const req = makePostRequest({
      title: "Bad priority",
      description: "Invalid enum value",
      priority: "P3",
    });

    const response = await POST(req);
    expect(response.status).toBe(400);
    const body = (await response.json()) as { error: string };
    expect(body.error).toBe("Validation failed");
  });
});
