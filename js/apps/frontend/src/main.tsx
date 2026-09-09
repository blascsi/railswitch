import * as Sentry from "@sentry/react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App.tsx";
import { AppEnvironment } from "./environment.ts";

if (AppEnvironment.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: AppEnvironment.VITE_SENTRY_DSN,
    tracesSampleRate: AppEnvironment.VITE_SENTRY_TRACES_SAMPLE_RATE,
  });
}

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("No root element found!");
}

createRoot(rootElement, {
  onCaughtError: Sentry.reactErrorHandler(),
  onUncaughtError: Sentry.reactErrorHandler(),
  onRecoverableError: Sentry.reactErrorHandler(),
}).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
