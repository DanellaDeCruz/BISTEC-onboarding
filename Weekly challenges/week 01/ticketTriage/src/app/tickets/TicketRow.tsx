"use client";

import { useState } from "react";
import type { Ticket } from "@prisma/client";
import { PRIORITIES, Priority } from "@/lib/types";

const PRIORITY_LABELS: Record<Priority, string> = {
  P0: "P0 — Critical",
  P1: "P1 — High",
  P2: "P2 — Normal",
};

interface TicketRowProps {
  ticket: Ticket;
  onPriorityChange: (id: string, newPriority: Priority) => void;
  onOwnerChange: (id: string, newOwner: string | null) => void;
}

interface PatchBody {
  priority?: Priority;
  owner?: string | null;
}

async function patchTicket(id: string, body: PatchBody): Promise<Ticket> {
  const res = await fetch(`/api/tickets/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await res.json()) as Ticket & { error?: string };
  if (!res.ok) {
    throw new Error((data as unknown as { error: string }).error ?? "Update failed");
  }
  return data;
}

export function TicketRow({ ticket, onPriorityChange, onOwnerChange }: TicketRowProps) {
  const [priority, setPriority] = useState<Priority>(ticket.priority as Priority);
  const [owner, setOwner] = useState<string | null>(ticket.owner);
  const [ownerInput, setOwnerInput] = useState<string>(ticket.owner ?? "");
  const [isEditingOwner, setIsEditingOwner] = useState(false);
  const [isPriorityPending, setIsPriorityPending] = useState(false);
  const [isOwnerPending, setIsOwnerPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function formatDate(date: Date): string {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(date));
  }

  async function handlePriorityChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newPriority = e.target.value as Priority;
    const prev = priority;
    setPriority(newPriority);
    setError(null);
    setIsPriorityPending(true);

    try {
      await patchTicket(ticket.id, { priority: newPriority });
      onPriorityChange(ticket.id, newPriority);
    } catch (err) {
      setPriority(prev);
      setError(err instanceof Error ? err.message : "Failed to update priority");
    } finally {
      setIsPriorityPending(false);
    }
  }

  function startEditingOwner() {
    setOwnerInput(owner ?? "");
    setIsEditingOwner(true);
    setError(null);
  }

  function cancelEditingOwner() {
    setIsEditingOwner(false);
    setOwnerInput(owner ?? "");
    setError(null);
  }

  async function handleOwnerSave() {
    const trimmed = ownerInput.trim();
    if (trimmed === "") {
      setError("Owner name cannot be empty");
      return;
    }

    const prev = owner;
    setOwner(trimmed);
    setIsEditingOwner(false);
    setError(null);
    setIsOwnerPending(true);

    try {
      const updated = await patchTicket(ticket.id, { owner: trimmed });
      setOwner(updated.owner);
      onOwnerChange(ticket.id, updated.owner);
    } catch (err) {
      setOwner(prev);
      setOwnerInput(prev ?? "");
      setError(err instanceof Error ? err.message : "Failed to update owner");
    } finally {
      setIsOwnerPending(false);
    }
  }

  function handleOwnerKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") void handleOwnerSave();
    if (e.key === "Escape") cancelEditingOwner();
  }

  return (
    <li className="px-5 py-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-gray-900">{ticket.title}</p>
          <p className="mt-0.5 line-clamp-2 text-sm text-gray-500">{ticket.description}</p>
          {error !== null && (
            <p className="mt-1 text-xs font-medium text-red-600" role="alert">
              {error}
            </p>
          )}
        </div>

        <div className="shrink-0 text-right space-y-1.5">
          {/* Priority selector */}
          <div>
            <select
              value={priority}
              onChange={(e) => void handlePriorityChange(e)}
              disabled={isPriorityPending}
              aria-label={`Priority for ${ticket.title}`}
              className={[
                "rounded border px-2 py-0.5 text-xs font-medium",
                "focus:outline-none focus:ring-2 focus:ring-offset-1",
                isPriorityPending
                  ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400"
                  : "border-gray-300 bg-white text-gray-700 hover:border-gray-400 focus:ring-blue-500",
              ].join(" ")}
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {PRIORITY_LABELS[p]}
                </option>
              ))}
            </select>
          </div>

          {/* Owner field */}
          <div className="text-xs">
            {isEditingOwner ? (
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={ownerInput}
                  onChange={(e) => setOwnerInput(e.target.value)}
                  onKeyDown={handleOwnerKeyDown}
                  maxLength={100}
                  autoFocus
                  aria-label={`Owner for ${ticket.title}`}
                  className="w-28 rounded border border-gray-300 px-1.5 py-0.5 text-xs text-gray-700 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
                />
                <button
                  onClick={() => void handleOwnerSave()}
                  disabled={isOwnerPending}
                  aria-label="Save owner"
                  className="rounded bg-blue-600 px-1.5 py-0.5 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 disabled:opacity-50"
                >
                  ✓
                </button>
                <button
                  onClick={cancelEditingOwner}
                  aria-label="Cancel editing owner"
                  className="rounded bg-gray-100 px-1.5 py-0.5 text-gray-600 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-1"
                >
                  ✕
                </button>
              </div>
            ) : (
              <button
                onClick={startEditingOwner}
                disabled={isOwnerPending}
                aria-label={owner !== null ? `Edit owner: ${owner}` : "Assign owner"}
                className={[
                  "rounded px-1 py-0.5 text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1",
                  isOwnerPending ? "cursor-wait opacity-50" : "hover:underline",
                  owner !== null ? "font-medium text-gray-600" : "italic text-gray-400",
                ].join(" ")}
              >
                {isOwnerPending ? "Saving…" : (owner ?? "Unassigned")}
              </button>
            )}
          </div>

          <p className="text-xs text-gray-400">{formatDate(ticket.createdAt)}</p>
        </div>
      </div>
    </li>
  );
}
