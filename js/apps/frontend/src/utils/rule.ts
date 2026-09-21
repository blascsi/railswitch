import { rulesSchema, type Rules } from "@railswitch/schemas";

export function formatRules(rules: string) {
  try {
    return JSON.stringify(JSON.parse(rules), null, 2);
  } catch {
    return rules;
  }
}

export function parseRules(rules: string): Rules | null {
  try {
    const json: unknown = JSON.parse(rules);
    return rulesSchema.parse(json);
  } catch {
    return null;
  }
}

export function areRulesEqual(a: string, b: string) {
  const parsedA = parseRules(a);
  const parsedB = parseRules(b);

  if (parsedA == null || parsedB == null) {
    return a === b;
  }

  return JSON.stringify(parsedA) === JSON.stringify(parsedB);
}

export function validateRules(rules: string) {
  let parsed: unknown;

  try {
    parsed = JSON.parse(rules);
  } catch {
    return "Rules must be valid JSON";
  }

  const result = rulesSchema.safeParse(parsed);

  return result.success
    ? undefined
    : (result.error.issues[0]?.message ?? "Invalid rule configuration");
}
