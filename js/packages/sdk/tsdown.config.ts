import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["./src/index.ts"],
  minify: true,
  dts: { eager: true },
  deps: { neverBundle: [/^zod/] },
  treeshake: { moduleSideEffects: false },
  report: { brotli: true },
});
