import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const testFixtureDir = fileURLToPath(
  new URL("../../../data/flag_evaluation_tests", import.meta.url),
);

export default defineConfig({
  test: {
    // Both of these are required for some reason?
    forceRerunTriggers: [testFixtureDir, `${testFixtureDir}/**/*.jsonc`],
  },
});
