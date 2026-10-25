import { execSync } from "node:child_process";
import { rmSync } from "node:fs";

// Starts every test run with a fresh, fully migrated test database.
export default function setup() {
  for (const file of ["prisma/test.db", "prisma/test.db-journal"]) rmSync(file, { force: true });
  execSync("npx prisma migrate deploy", {
    env: { ...process.env, DATABASE_URL: "file:./prisma/test.db" },
    stdio: "ignore",
  });
}
