"use client";

import { useState } from "react";
import type { Ticket } from "@prisma/client";
import { PRIORITIES, Priority } from "@/lib/types";
import { TicketRow } from "./TicketRow";

const PRIORITY_LABELS: Record<Priority, string> = {
  P0: "P0 — Critical",
  P1: "P1 — High",
  P2: "P2 — Normal",
};

const PRIORITY_COLORS: Record<
  Priority,
  { badge: string; header: string; border: string }
> = {
  P0: {
    badge: "bg-red-600 text-white",
    header: "text-red-700",
    border: "border-red-200",
  },
  P1: {
    badge: "bg-orange-500 text-white",
    header: "text-orange-700",
    border: "border-orange-200",
  },
  P2: {
    badge: "bg-blue-500 text-white",
    header: "text-blue-700",
    border: "border-blue-200",
  },
};

function groupByPriority(tickets: Ticket[]): Record<Priority, Ticket[]> {
  const groups: Record<Priority, Ticket[]> = { P0: [], P1: [], P2: [] };
  for (const ticket of tickets) {
    const p = ticket.priority as Priority;
    if (p in groups) groups[p].push(ticket);
  }
  return groups;
}

interface TicketBoardProps {
  initialTickets: Ticket[];
}

export function TicketBoard({ initialTickets }: TicketBoardProps) {
  const [tickets, setTickets] = useState<Ticket[]>(initialTickets);

  function handlePriorityChange(id: string, newPriority: Priority) {
    setTickets((prev) =>
      prev.map((t) => (t.id === id ? { ...t, priority: newPriority } : t))
    );
  }

  function handleOwnerChange(id: string, newOwner: string | null) {
    setTickets((prev) =>
      prev.map((t) => (t.id === id ? { ...t, owner: newOwner } : t))
    );
  }

  const groups = groupByPriority(tickets);
  const total = tickets.length;

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Ticket Triage</h1>
        <p className="mt-1 text-sm text-gray-500">
          {total} open ticket{total !== 1 ? "s" : ""} · grouped by priority
        </p>
      </div>

      <div className="space-y-8">
        {PRIORITIES.map((priority) => {
          const group = groups[priority];
          const colors = PRIORITY_COLORS[priority];

          return (
            <section key={priority}>
              <div className="mb-3 flex items-center gap-3">
                <h2 className={`text-lg font-semibold ${colors.header}`}>
                  {PRIORITY_LABELS[priority]}
                </h2>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${colors.badge}`}
                >
                  {group.length}
                </span>
              </div>

              {group.length === 0 ? (
                <p className="rounded-lg border border-dashed border-gray-200 py-6 text-center text-sm text-gray-400">
                  No {priority} tickets
                </p>
              ) : (
                <ul
                  className={`divide-y rounded-lg border bg-white ${colors.border}`}
                >
                  {group.map((ticket) => (
                    <TicketRow
                      key={ticket.id}
                      ticket={ticket}
                      onPriorityChange={handlePriorityChange}
                      onOwnerChange={handleOwnerChange}
                    />
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>
    </>
  );
}
