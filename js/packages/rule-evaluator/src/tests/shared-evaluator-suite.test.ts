import { readdir, readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { parse } from "jsonc-parser";
import { describe, expect, it } from "vitest";

import type { Rules } from "@railswitch/schemas";

import { evaluateRules, type Context } from "../index.js";

interface TestCase {
  description: string;
  context: Context;
  configuration: Rules;
  defaultValue: unknown;
  expected: unknown;
}

const fixturesDir = fileURLToPath(
  new URL(resolve("../../../data/flag_evaluation_tests"), import.meta.url),
);

const files = (await readdir(fixturesDir)).filter((f) => f.endsWith(".jsonc"));

const fixtures = await Promise.all(
  files.map(async (file) => {
    const { testCases } = parse(
      await readFile(join(fixturesDir, file), "utf-8"),
    ) as { testCases: TestCase[] };
    return { file, testCases };
  }),
);

for (const { file, testCases } of fixtures) {
  describe(file, () => {
    it.each(testCases)(
      "$description",
      ({ context, configuration, defaultValue, expected }) => {
        expect(evaluateRules(context, configuration, defaultValue)).toEqual(
          expected,
        );
      },
    );
  });
}
