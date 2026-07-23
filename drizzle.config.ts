import { defineConfig } from "drizzle-kit";

// Optional SQLite migration configuration; the current browser-only app does not call it.
export default defineConfig({
  out: "./drizzle",
  schema: "./db/schema.ts",
  dialect: "sqlite",
});
