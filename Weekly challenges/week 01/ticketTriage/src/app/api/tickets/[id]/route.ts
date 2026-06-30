import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { PRIORITIES } from "@/lib/types";
import type { Ticket } from "@prisma/client";

const patchSchema = z.object({
  priority: z.enum(PRIORITIES).optional(),
  owner: z.string().trim().min(1).max(100).nullable().optional(),
});

type PatchBody = z.infer<typeof patchSchema>;

type ErrorResponse = { error: string; details?: z.ZodIssue[] };

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<Ticket | ErrorResponse>> {
  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json<ErrorResponse>(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json<ErrorResponse>(
      { error: "Validation failed", details: parsed.error.issues },
      { status: 400 }
    );
  }

  const data: PatchBody = parsed.data;

  if (Object.keys(data).length === 0) {
    return NextResponse.json<ErrorResponse>(
      { error: "No updatable fields provided" },
      { status: 400 }
    );
  }

  const existing = await db.ticket.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json<ErrorResponse>(
      { error: "Ticket not found" },
      { status: 404 }
    );
  }

  const updated = await db.ticket.update({
    where: { id },
    data,
  });

  return NextResponse.json(updated);
}
