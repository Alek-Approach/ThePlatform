import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Local SQLite file by default; set DATABASE_URL to use another database.
    url: process.env["DATABASE_URL"] ?? "file:./prisma/dev.db",
  },
});
