import z from "zod";

export const lowercaseLettersAndUnderscoresSchema = z
  .string()
  .trim()
  .min(1, "must contain at least one character")
  .regex(/^[a-z_]+$/, "must contain only lowercase letters and underscores");
