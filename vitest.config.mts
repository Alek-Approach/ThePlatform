import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Automated tests. They use their own database file (prisma/test.db), never your real data.
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      // "server-only" protects server code inside Next.js; it isn't needed in tests.
      "server-only": fileURLToPath(new URL("./tests/support/empty.ts", import.meta.url)),
    },
  },
  test: {
    include: ["tests/**/*.test.ts"],
    globalSetup: ["tests/support/global-setup.ts"],
    env: { DATABASE_URL: "file:./prisma/test.db", AI_MODE: "mock" },
    fileParallelism: false, // one SQLite file, so run test files one after another
  },
});
