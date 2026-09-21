import type { SelectorOptionData } from "@astryxdesign/core/Selector";

import {
  attributeOperatorSchema,
  combinatorOperatorSchema,
  conditionValueTypeSchema,
  ruleValueResultValueTypeSchema,
  type ConditionValue,
  type ConditionValueType,
  type RuleValueResultValue,
  type RuleValueResultValueType,
} from "@railswitch/schemas";

const toOptions = <T extends string>(
  values: readonly T[],
  labels: Record<T, string>,
): SelectorOptionData[] =>
  values.map((value) => ({ value, label: labels[value] }));

export const COMBINATOR_OPTIONS = toOptions(combinatorOperatorSchema.options, {
  and: "All",
  or: "Any",
});

export const VALUE_TYPE_OPTIONS = toOptions(conditionValueTypeSchema.options, {
  string: "String",
  number: "Number",
  boolean: "Boolean",
});

export const VALUE_TYPE_DEFAULT_VALUES = {
  string: "",
  number: 0,
  boolean: false,
} satisfies Record<ConditionValueType, ConditionValue>;

export const RESULT_TYPE_OPTIONS = toOptions(
  ruleValueResultValueTypeSchema.options,
  {
    string: "String",
    number: "Number",
    boolean: "Boolean",
  },
);

export const RESULT_TYPE_DEFAULT_VALUES = {
  string: "",
  number: 0,
  boolean: false,
} satisfies Record<RuleValueResultValueType, RuleValueResultValue>;

export const OPERATOR_OPTIONS = toOptions(attributeOperatorSchema.options, {
  eq: "is equal to",
  neq: "is not equal to",
  lt: "is less than",
  lte: "is less than or equal",
  gt: "is greater than",
  gte: "is greater than or equal",
  contains: "contains the string",
  not_contains: "does not contain the string",
  exists: "exists",
  not_exists: "does not exist",
  is_true: "is true",
  is_false: "is false",
});
