import { defineConfig } from "eslint/config";

// Static-analysis configuration. Build output and installed packages are excluded.
export default defineConfig([
  {
    ignores: ["dist/**", "node_modules/**"],
  },
]);
