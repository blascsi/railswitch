import { z } from "zod";

export const combinatorOperatorSchema = z.enum(["and", "or"]);

export const valuelessOperatorSchema = z.enum([
  "exists",
  "not_exists",
  "is_true",
  "is_false",
]);
export const anyValueOperatorSchema = z.enum(["eq", "neq"]);
export const numericOperatorSchema = z.enum(["lt", "lte", "gt", "gte"]);
export const stringOperatorSchema = z.enum(["contains", "not_contains"]);

export const attributeOperatorSchema = z.enum([
  ...anyValueOperatorSchema.options,
  ...numericOperatorSchema.options,
  ...stringOperatorSchema.options,
  ...valuelessOperatorSchema.options,
]);

export const conditionValueTypeSchema = z.enum(["string", "number", "boolean"]);

export const ruleValueResultValueTypeSchema = z.enum([
  "string",
  "number",
  "boolean",
]);

const attributeConditionFields = {
  type: z.literal("attribute"),
  attribute: z.string().trim().min(1),
};

const anyValueConditionSchema = z.strictObject({
  ...attributeConditionFields,
  operator: anyValueOperatorSchema,
  value: z.union([z.string(), z.number(), z.boolean()]),
});

const attributeConditionSchema = z.discriminatedUnion("operator", [
  z.strictObject({
    ...attributeConditionFields,
    operator: valuelessOperatorSchema,
  }),
  anyValueConditionSchema,
  z.strictObject({
    ...attributeConditionFields,
    operator: numericOperatorSchema,
    value: z.number(),
  }),
  z.strictObject({
    ...attributeConditionFields,
    operator: stringOperatorSchema,
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

const valueResultValueSchemas = {
  string: z.string(),
  number: z.number(),
  boolean: z.boolean(),
} satisfies Record<RuleValueResultValueType, z.ZodType>;

function createValueResultSchemaForType<T extends RuleValueResultValueType>(
  type: T,
) {
  return z.strictObject({
    type: z.literal("value"),
    value: valueResultValueSchemas[type],
  });
}

function createResultSchemaForType<T extends RuleValueResultValueType>(
  type: T,
) {
  return z.discriminatedUnion("type", [createValueResultSchemaForType(type)]);
}

function createRuleSchemaForType<T extends RuleValueResultValueType>(type: T) {
  return z.strictObject({
    description: z.string().optional(),
    enabled: z.boolean(),
    conditions: conditionGroupSchema,
    result: createResultSchemaForType(type),
  });
}

function createRulesSchemaForType<T extends RuleValueResultValueType>(type: T) {
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

export type RuleValueResultValueType = z.infer<
  typeof ruleValueResultValueTypeSchema
>;
export type Rules = z.infer<typeof rulesSchema>;
export type Rule = z.infer<
  ReturnType<typeof createRuleSchemaForType<RuleValueResultValueType>>
>;
export type RuleResult = z.infer<
  ReturnType<typeof createResultSchemaForType<RuleValueResultValueType>>
>;
export type RuleValueResult = z.infer<
  ReturnType<typeof createValueResultSchemaForType<RuleValueResultValueType>>
>;
export type RuleValueResultValue = RuleValueResult["value"];
export type ConditionGroup = z.infer<typeof conditionGroupSchema>;
export type Conditions = z.infer<typeof conditionsSchema>;
export type ConditionOrGroup = Conditions[number];
export type Condition = z.infer<typeof conditionSchema>;
export type AttributeCondition = z.infer<typeof attributeConditionSchema>;
export type CombinatorOperator = z.infer<typeof combinatorOperatorSchema>;
export type AttributeOperator = z.infer<typeof attributeOperatorSchema>;
export type ConditionValueType = z.infer<typeof conditionValueTypeSchema>;
export type AnyValueCondition = z.infer<typeof anyValueConditionSchema>;
export type ConditionValue = AnyValueCondition["value"];
