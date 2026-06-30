import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { PRIORITIES } from "@/lib/types";
import type { Ticket } from "@prisma/client";

type ErrorResponse = { error: string; details?: z.ZodIssue[] };

const createSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1).max(2000),
  priority: z.enum(PRIORITIES).default("P1"),
  owner: z.string().trim().min(1).max(100).nullable().optional(),
});

export async function GET(): Promise<NextResponse<Ticket[]>> {
  const tickets = await db.ticket.findMany({
    orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
  });

  return NextResponse.json(tickets);
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<Ticket | ErrorResponse>> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json<ErrorResponse>(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json<ErrorResponse>(
      { error: "Validation failed", details: parsed.error.issues },
      { status: 400 }
    );
  }

  const ticket = await db.ticket.create({ data: parsed.data });
  return NextResponse.json(ticket, { status: 201 });
}
