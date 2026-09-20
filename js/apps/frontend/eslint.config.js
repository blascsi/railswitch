import { reactConfig } from "@railswitch/config/eslint/react";

export default reactConfig({
  tsconfigRootDir: import.meta.dirname,
  ignores: [
    "src/graphql/graphql-env.d.ts",
    "src/graphql/introspection.ts",
    "src/routeTree.gen.ts",
  ],
});
