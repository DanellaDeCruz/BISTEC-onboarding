import { PrismaClient } from "@prisma/client";
import { Priority } from "../../src/lib/types";

export const testDb = new PrismaClient();

export async function clearTickets(): Promise<void> {
  await testDb.ticket.deleteMany();
}

export async function createTicket(overrides?: {
  title?: string;
  description?: string;
  priority?: Priority;
  owner?: string | null;
}) {
  return testDb.ticket.create({
    data: {
      title: overrides?.title ?? "Test ticket",
      description: overrides?.description ?? "Test description",
      priority: overrides?.priority ?? Priority.P1,
      owner: overrides?.owner ?? null,
    },
  });
}
