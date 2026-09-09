import { writeFileSync } from "node:fs";
import { z } from "zod";
import { rulesSchema } from "../src/rules.ts";

const outputPath = new URL(
  "../../../../elixir/backend/priv/generated/rules.schema.json",
  import.meta.url,
);

const jsonSchema = z.toJSONSchema(rulesSchema, {
  io: "input",
  target: "draft-7",
});

writeFileSync(outputPath, `${JSON.stringify(jsonSchema, null, 2)}\n`);
