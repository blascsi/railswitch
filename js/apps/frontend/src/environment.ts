import z from "zod";

const environmentSchema = z.object({
  FRONTEND_API_URL: z.url(),

  FRONTEND_RAILSWITCH_URL: z.url().default("http://localhost:4000/sdk/socket"),
  FRONTEND_RAILSWITCH_API_KEY: z.string().default(""),

  FRONTEND_SENTRY_DSN: z.url().optional(),
  FRONTEND_SENTRY_TRACES_SAMPLE_RATE: z.coerce
    .number()
    .min(0)
    .max(1)
    .default(0.01),
});

const definedValues = Object.fromEntries(
  Object.entries(window.__ENV__ ?? {}).filter(([_, value]) => value !== ""),
);

export const AppEnvironment = environmentSchema.parse(definedValues);
