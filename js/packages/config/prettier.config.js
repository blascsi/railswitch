import { fileURLToPath } from "node:url";

const sortImports = fileURLToPath(
  import.meta.resolve("@ianvs/prettier-plugin-sort-imports"),
);

/** @type {import("prettier").Config} */
export default {
  useTabs: false,
  singleQuote: false,
  plugins: [sortImports],
  importOrder: [
    "<BUILTIN_MODULES>",
    "",
    "<THIRD_PARTY_MODULES>",
    "",
    "^@railswitch/",
    "",
    "^[./]",
  ],
};
