import { readFileSync, writeFileSync } from "node:fs";

import { minifyIntrospectionQuery } from "@urql/introspection";
import { buildSchema, introspectionFromSchema } from "graphql";

const schemaPath = new URL(
  "../../../../elixir/backend/generated/schema.graphql",
  import.meta.url,
);
const outputPath = new URL("../src/graphql/introspection.ts", import.meta.url);

const schema = buildSchema(readFileSync(schemaPath, "utf8"));
const minified = minifyIntrospectionQuery(introspectionFromSchema(schema));

writeFileSync(
  outputPath,
  `import type { IntrospectionQuery } from "graphql";\n\nexport const introspection = ${JSON.stringify(minified)} as unknown as IntrospectionQuery;\n`,
);
