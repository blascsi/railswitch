import { heyApiPlugin } from "@hey-api/vite-plugin";
import babel from "@rolldown/plugin-babel";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  server: {
    port: 3000,
  },
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    heyApiPlugin({
      config: {
        input: "../../../elixir/backend/generated/openapi.json",
        output: "src/generated/client",
        plugins: [
          {
            name: "@hey-api/client-fetch",
            runtimeConfigPath: "./src/hey-api.ts",
          },
          "@hey-api/typescript",
          {
            name: "zod",
            requests: true,
            responses: true,
            definitions: true,
          },
          {
            name: "@hey-api/sdk",
            validator: true,
          },
          {
            name: "@tanstack/react-query",
            queryOptions: true,
            mutationOptions: true,
            queryKeys: { tags: true },
          },
        ],
      },
    }),
  ],
  build: {
    sourcemap: true,
    cssCodeSplit: true,
    chunkSizeWarningLimit: 600,
    rolldownOptions: {
      output: {
        codeSplitting: {
          minSize: 20_000,
          groups: [
            {
              name: "react-vendor",
              test: /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/,
              priority: 100,
            },
            {
              name: "mantine",
              test: /[\\/]node_modules[\\/]@mantine[\\/]/,
              priority: 90,
            },
          ],
        },
      },
    },
  },
  optimizeDeps: {
    include: ["react", "react-dom", "wouter"],
  },
});
