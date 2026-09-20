import js from "@eslint/js";
import prettier from "eslint-config-prettier/flat";
import unusedImports from "eslint-plugin-unused-imports";
import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";

/**
 * @param {object} options
 * @param {string} options.tsconfigRootDir Package root, for the TS project service.
 * @param {string[]} [options.ignores] Paths to skip, on top of the defaults.
 * @param {{files: string[], project: string}[]} [options.projects] Explicit
 *   tsconfigs for sources the project service cannot reach on its own, because
 *   no `tsconfig.json` above them includes or references them.
 */
export function baseConfig({ tsconfigRootDir, ignores = [], projects = [] }) {
  return defineConfig(
    { ignores: ["**/node_modules/**", "**/dist/**", ...ignores] },
    // Tells ESLint which extensions to expand a directory argument into.
    { files: ["**/*.{js,mjs,cjs,ts,tsx}"] },
    js.configs.recommended,
    tseslint.configs.recommendedTypeChecked,
    {
      languageOptions: {
        parserOptions: { projectService: true, tsconfigRootDir },
      },
    },
    ...projects.map(({ files, project }) => ({
      files,
      languageOptions: {
        parserOptions: { projectService: false, project, tsconfigRootDir },
      },
    })),
    {
      plugins: { "unused-imports": unusedImports },
      rules: {
        "@typescript-eslint/no-unused-vars": "off",
        "unused-imports/no-unused-imports": "error",
        "unused-imports/no-unused-vars": [
          "error",
          {
            argsIgnorePattern: "^_",
            caughtErrorsIgnorePattern: "^_",
            destructuredArrayIgnorePattern: "^_",
            varsIgnorePattern: "^_",
          },
        ],
      },
    },
    // Config files sit outside every tsconfig's `include`.
    {
      files: ["*.config.{js,ts}", "eslint.config.js"],
      extends: [tseslint.configs.disableTypeChecked],
    },
    // Last, so it can switch off anything above that fights the formatter.
    prettier,
  );
}
