import { PrismaClient } from "@prisma/client";
import { Priority } from "../src/lib/types";

const prisma = new PrismaClient();

async function main(): Promise<void> {
  await prisma.ticket.deleteMany();

  const tickets: Array<{
    title: string;
    description: string;
    priority: Priority;
    owner: string | null;
  }> = [
    {
      title: "Production database unreachable",
      description: "Primary DB is returning connection timeouts for all regions. Customers cannot log in.",
      priority: Priority.P0,
      owner: "Danella",
    },
    {
      title: "Payment gateway returning 500 errors",
      description: "Checkout flow fails for all users. Revenue impact ongoing.",
      priority: Priority.P0,
      owner: "Marlon",
    },
    {
      title: "Login page throws unhandled exception",
      description: "Specific edge case with SSO tokens causes a white screen for enterprise users.",
      priority: Priority.P1,
      owner: "Danella",
    },
    {
      title: "Email notifications delayed by 2+ hours",
      description: "Queue worker appears backed up. Users are not receiving order confirmations promptly.",
      priority: Priority.P1,
      owner: null,
    },
    {
      title: "CSV export truncates rows beyond 1000",
      description: "Report exports silently drop rows when result set exceeds 1000 records.",
      priority: Priority.P1,
      owner: "Marlon",
    },
    {
      title: "Dashboard chart flickers on Firefox",
      description: "Line chart animation causes visible flicker on Firefox 121+. Chrome and Safari unaffected.",
      priority: Priority.P2,
      owner: null,
    },
    {
      title: "Typo in onboarding copy",
      description: "Step 3 reads 'Wellcome' instead of 'Welcome'. Minor but visible to all new users.",
      priority: Priority.P2,
      owner: null,
    },
    {
      title: "Tooltip misaligned on mobile",
      description: "Action tooltip overflows the viewport on screens narrower than 375px.",
      priority: Priority.P2,
      owner: null,
    },
    {
      title: "User preferences not persisted after logout",
      description: "Theme and language settings reset to defaults when the user logs out and back in.",
      priority: Priority.P1,
      owner: null,
    },
    {
      title: "Pagination resets to page 1 on filter change",
      description: "When applying a new filter the cursor jumps back to page 1 instead of staying in place.",
      priority: Priority.P2,
      owner: "Danella",
    },
  ];

  for (const ticket of tickets) {
    await prisma.ticket.create({ data: ticket });
  }

  console.log(`Seeded ${tickets.length} tickets.`);
}

main()
  .catch((err: unknown) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
