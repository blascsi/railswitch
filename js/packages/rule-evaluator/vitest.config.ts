import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

const testFixtureDir = fileURLToPath(
  new URL("../../../data/flag_evaluation_tests", import.meta.url),
);

export default defineConfig({
  test: {
    chaiConfig: {
      truncateThreshold: 100_000_000,
    },
    // Both of these are required for some reason?
    forceRerunTriggers: [testFixtureDir, `${testFixtureDir}/**/*.jsonc`],
  },
});
