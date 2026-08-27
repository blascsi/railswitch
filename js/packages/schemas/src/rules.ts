import { z } from "zod";

const comparisonOperatorSchema = z.enum([
  "eq",
  "neq",
  "lt",
  "lte",
  "gt",
  "gte",
  "contains",
  "not_contains",
  "exists",
  "not_exists",
  "is_true",
  "is_false",
]);

const combinatorOperatorSchema = z.enum(["and", "or"]);

const attributeConditionSchema = z
  .strictObject({
    type: z.literal("attribute"),
    attribute: z.string().min(1).trim(),
    operator: comparisonOperatorSchema,
    value: z.unknown().optional(),
  })
  .refine(
    (val) => {
      // Making sure that operations that can't accept values always pass
      if (
        ["exists", "not_exists", "is_true", "is_false"].includes(val.operator)
      ) {
        return true;
      }

      return val.value != null;
    },
    {
      error: "Condition must have 'value' for comparison operators",
    },
  );

const conditionSchema = z.discriminatedUnion("type", [
  attributeConditionSchema,
]);

const conditionsSchema = z.array(
  z.union([conditionSchema, z.lazy(() => conditionGroupSchema)]),
);

const conditionGroupSchema: z.ZodType<{
  combinator: z.infer<typeof combinatorOperatorSchema>;
  conditions: z.infer<typeof conditionsSchema>;
}> = z.strictObject({
  combinator: combinatorOperatorSchema,
  conditions: conditionsSchema,
});

const resultValueSchemas = {
  string: z.string(),
  number: z.number(),
  boolean: z.boolean(),
};

function createValueResultSchemaForType<T extends ResultType>(type: T) {
  return z.strictObject({
    type: z.literal("value"),
    value: resultValueSchemas[type],
  });
}

function createResultSchemaForType<T extends ResultType>(type: T) {
  return z.discriminatedUnion("type", [createValueResultSchemaForType(type)]);
}

function createRuleSchemaForType<T extends ResultType>(type: T) {
  return z.strictObject({
    description: z.string().optional(),
    enabled: z.boolean(),
    conditions: conditionGroupSchema,
    result: createResultSchemaForType(type),
  });
}

function createRulesSchemaForType<T extends ResultType>(type: T) {
  return z.strictObject({
    resultType: z.literal(type),
    rules: z.array(createRuleSchemaForType(type)),
  });
}

export const rulesSchema = z.discriminatedUnion("resultType", [
  createRulesSchemaForType("boolean"),
  createRulesSchemaForType("number"),
  createRulesSchemaForType("string"),
]);

type ResultType = keyof typeof resultValueSchemas;
export type Rules = z.infer<typeof rulesSchema>;
export type Rule = z.infer<
  ReturnType<typeof createRuleSchemaForType<ResultType>>
>;
export type RuleResult = z.infer<
  ReturnType<typeof createResultSchemaForType<ResultType>>
>;
export type RuleValueResult = z.infer<
  ReturnType<typeof createValueResultSchemaForType<ResultType>>
>;
export type ConditionGroup = z.infer<typeof conditionGroupSchema>;
export type Conditions = z.infer<typeof conditionsSchema>;
export type Condition = z.infer<typeof conditionSchema>;
export type AttributeCondition = z.infer<typeof attributeConditionSchema>;
export type CombinatorOperator = z.infer<typeof combinatorOperatorSchema>;
export type ComparisionOperator = z.infer<typeof comparisonOperatorSchema>;
