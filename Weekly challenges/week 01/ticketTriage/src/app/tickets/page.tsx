import { db } from "@/lib/db";
import { TicketBoard } from "./TicketBoard";

// Live dashboard: render on demand so it always reflects current ticket
// state (and so the build never queries the DB during static prerender).
export const dynamic = "force-dynamic";

export default async function TicketsDashboard() {
  const tickets = await db.ticket.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-4xl">
        <TicketBoard initialTickets={tickets} />
      </div>
    </main>
  );
}
