import { z } from "zod";

const combinatorOperatorSchema = z.enum(["and", "or"]);

const attributeConditionFields = {
  type: z.literal("attribute"),
  attribute: z.string().trim().min(1),
};

const attributeConditionSchema = z.discriminatedUnion("operator", [
  z.strictObject({
    ...attributeConditionFields,
    operator: z.enum(["exists", "not_exists", "is_true", "is_false"]),
  }),
  z.strictObject({
    ...attributeConditionFields,
    operator: z.enum(["eq", "neq"]),
    value: z.union([z.string(), z.number(), z.boolean()]),
  }),
  z.strictObject({
    ...attributeConditionFields,
    operator: z.enum(["lt", "lte", "gt", "gte"]),
    value: z.number(),
  }),
  z.strictObject({
    ...attributeConditionFields,
    operator: z.enum(["contains", "not_contains"]),
    value: z.string(),
  }),
]);

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
export type ComparisionOperator = AttributeCondition["operator"];
