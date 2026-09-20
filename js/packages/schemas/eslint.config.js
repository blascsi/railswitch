import { baseConfig } from "@railswitch/config/eslint";

export default baseConfig({
  tsconfigRootDir: import.meta.dirname,
  // `scripts/` is covered by tsconfig.scripts.json, which no tsconfig.json
  // references, so the project service cannot find these files on its own.
  projects: [
    { files: ["scripts/**/*.ts"], project: "./tsconfig.scripts.json" },
  ],
});
