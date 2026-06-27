import babel from "@rolldown/plugin-babel";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), babel({ presets: [reactCompilerPreset()] })],
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
