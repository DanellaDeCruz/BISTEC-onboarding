import { execSync } from "child_process";
import { existsSync, unlinkSync } from "fs";

export function setup(): void {
  if (existsSync("./prisma/test.db")) {
    unlinkSync("./prisma/test.db");
  }
  execSync("pnpm exec prisma migrate deploy", {
    env: { ...process.env, DATABASE_URL: "file:./prisma/test.db" },
    stdio: "pipe",
  });
}

export function teardown(): void {
  if (existsSync("./prisma/test.db")) {
    unlinkSync("./prisma/test.db");
  }
}
