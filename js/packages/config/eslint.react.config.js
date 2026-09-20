import reactHooks from "eslint-plugin-react-hooks";
import { defineConfig } from "eslint/config";
import globals from "globals";

import { baseConfig } from "./eslint.config.js";

/** @param {Parameters<typeof baseConfig>[0]} options */
export function reactConfig(options) {
  return defineConfig(baseConfig(options), {
    files: ["**/*.{ts,tsx}"],
    languageOptions: { globals: globals.browser },
    extends: [reactHooks.configs.flat["recommended-latest"]],
    rules: {
      // TanStack Router signals control flow by throwing these.
      "@typescript-eslint/only-throw-error": [
        "error",
        {
          allow: [
            {
              from: "package",
              package: "@tanstack/router-core",
              name: "Redirect",
            },
            {
              from: "package",
              package: "@tanstack/router-core",
              name: "NotFoundError",
            },
          ],
        },
      ],
    },
  });
}
