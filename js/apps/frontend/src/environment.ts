import z from "zod";

const environmentSchema = z.object({
  // Sentry configuration
  VITE_SENTRY_DSN: z.url().optional(),
  VITE_SENTRY_TRACES_SAMPLE_RATE: z.coerce.number().min(0).max(1).default(0.01),
});

export const AppEnvironment = environmentSchema.parse(import.meta.env);
