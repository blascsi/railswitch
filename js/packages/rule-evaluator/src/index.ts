import type {
  AttributeCondition,
  ComparisionOperator,
  Condition,
  ConditionGroup,
  Rule,
  RuleResult,
  Rules,
} from "@railswitch/schemas";

type ResultType = Rules["resultType"];

export interface Context {
  id?: string;
  [key: string]: unknown;
}

const NO_VALUE_COMPARISION_OPERATORS: ComparisionOperator[] = [
  "is_true",
  "is_false",
  "exists",
  "not_exists",
] as const;

function evaluateComparisionOperator(
  operator: ComparisionOperator,
  valueFromContext: unknown,
  valueFromRule: unknown,
): boolean {
  switch (operator) {
    case "eq": {
      return valueFromContext === valueFromRule;
    }
    case "neq": {
      return (
        valueFromContext !== undefined && valueFromContext !== valueFromRule
      );
    }
    case "lt": {
      if (
        typeof valueFromContext !== "number" ||
        typeof valueFromRule !== "number"
      ) {
        return false;
      }
      return valueFromContext < valueFromRule;
    }
    case "lte": {
      if (
        typeof valueFromContext !== "number" ||
        typeof valueFromRule !== "number"
      ) {
        return false;
      }
      return valueFromContext <= valueFromRule;
    }
    case "gt": {
      if (
        typeof valueFromContext !== "number" ||
        typeof valueFromRule !== "number"
      ) {
        return false;
      }
      return valueFromContext > valueFromRule;
    }
    case "gte": {
      if (
        typeof valueFromContext !== "number" ||
        typeof valueFromRule !== "number"
      ) {
        return false;
      }
      return valueFromContext >= valueFromRule;
    }
    case "contains": {
      if (
        typeof valueFromContext !== "string" ||
        typeof valueFromRule !== "string"
      ) {
        return false;
      }
      return valueFromContext.includes(valueFromRule);
    }
    case "not_contains": {
      if (
        typeof valueFromContext !== "string" ||
        typeof valueFromRule !== "string"
      ) {
        return false;
      }
      return !valueFromContext.includes(valueFromRule);
    }
    case "is_true": {
      if (typeof valueFromContext !== "boolean") {
        return false;
      }

      return valueFromContext === true;
    }
    case "is_false": {
      if (typeof valueFromContext !== "boolean") {
        return false;
      }

      return valueFromContext === false;
    }
    case "exists": {
      return valueFromContext != null;
    }
    case "not_exists": {
      return valueFromContext == null;
    }
    default: {
      console.warn(`Unknown operator: ${operator}`);
      return false;
    }
  }
}

function getAttributeValueFromContext(
  context: Context,
  attribute: string,
): unknown {
  const valueFromContext = attribute
    .split(".")
    .reduce<unknown>((acc, accessor) => {
      if (acc === null || typeof acc !== "object") {
        return undefined;
      }

      const value = (acc as Record<string, unknown>)[accessor];
      return value;
    }, context);

  if (valueFromContext === undefined) {
    console.warn(`Could not find attribute ${attribute} in context`);
  }

  return valueFromContext;
}

function evaluateAttributeCondition(
  context: Context,
  attributeCondition: AttributeCondition,
) {
  const valueFromRule =
    "value" in attributeCondition ? attributeCondition.value : undefined;

  // Value is not defined, for an operator that requires it, so the flag has no way of evaluating to true
  if (
    valueFromRule === undefined &&
    !NO_VALUE_COMPARISION_OPERATORS.includes(attributeCondition.operator)
  ) {
    return false;
  }

  const valueFromContextAttribute = getAttributeValueFromContext(
    context,
    attributeCondition.attribute,
  );
  return evaluateComparisionOperator(
    attributeCondition.operator,
    valueFromContextAttribute,
    valueFromRule,
  );
}

function evaluateCondition(context: Context, condition: Condition) {
  switch (condition.type) {
    case "attribute": {
      return evaluateAttributeCondition(context, condition);
    }
    default: {
      console.warn(`Unknown condition type: ${condition.type}`);
      return false;
    }
  }
}

function evaluateConditionOrGroup(
  context: Context,
  conditionOrGroup: Condition | ConditionGroup,
): boolean {
  if ("combinator" in conditionOrGroup) {
    return evaluateConditionGroup(context, conditionOrGroup);
  }

  return evaluateCondition(context, conditionOrGroup);
}

function evaluateConditionGroup(
  context: Context,
  conditionGroup: ConditionGroup,
): boolean {
  if (!Array.isArray(conditionGroup.conditions)) {
    console.warn(
      `Conditions array is not an array in ${JSON.stringify(conditionGroup)}`,
    );
    return false;
  }

  if (conditionGroup.conditions.length === 0) {
    return false;
  }

  switch (conditionGroup.combinator) {
    case "and": {
      return conditionGroup.conditions.every((conditionOrGroup) =>
        evaluateConditionOrGroup(context, conditionOrGroup),
      );
    }
    case "or": {
      return conditionGroup.conditions.some((conditionOrGroup) =>
        evaluateConditionOrGroup(context, conditionOrGroup),
      );
    }
    default: {
      console.warn(
        `Unknown condition group combinator: ${conditionGroup.combinator}`,
      );
      return false;
    }
  }
}

function resolveResult(resultType: ResultType, result: RuleResult) {
  switch (result.type) {
    case "value": {
      if (typeof result.value !== resultType) {
        console.warn(
          `Rule result value does not match the '${resultType}' result type: ${result.value}`,
        );
        return undefined;
      }

      return result.value;
    }
    default: {
      console.warn(`Unknown rule result type: ${result.type}`);
      return undefined;
    }
  }
}

function evaluateRule(context: Context, resultType: ResultType, rule: Rule) {
  if (!rule.enabled) {
    return undefined;
  }

  const doesRuleMatch = evaluateConditionGroup(context, rule.conditions);

  if (doesRuleMatch) {
    return resolveResult(resultType, rule.result);
  } else {
    return undefined;
  }
}

export function evaluateRules<T>(
  context: Context,
  rules: Rules,
  defaultValue: T | null = null,
) {
  for (const rule of rules.rules) {
    const ruleResult = evaluateRule(context, rules.resultType, rule);
    if (ruleResult !== undefined) {
      return ruleResult;
    }
  }

  return defaultValue;
}
