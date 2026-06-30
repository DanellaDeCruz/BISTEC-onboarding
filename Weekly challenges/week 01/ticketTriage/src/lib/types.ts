// SQLite does not support Prisma native enums.
// Priority is defined here and enforced at the TypeScript + API validation layer.

export const Priority = {
  P0: "P0",
  P1: "P1",
  P2: "P2",
} as const;

export type Priority = (typeof Priority)[keyof typeof Priority];

export const PRIORITIES = [Priority.P0, Priority.P1, Priority.P2] as const;
