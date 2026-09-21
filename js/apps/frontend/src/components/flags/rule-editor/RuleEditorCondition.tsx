import { HStack } from "@astryxdesign/core/HStack";
import { MoreMenu } from "@astryxdesign/core/MoreMenu";
import { NumberInput } from "@astryxdesign/core/NumberInput";
import { Selector } from "@astryxdesign/core/Selector";
import { StackItem } from "@astryxdesign/core/Stack";
import { Switch } from "@astryxdesign/core/Switch";
import { TextInput } from "@astryxdesign/core/TextInput";

import {
  attributeOperatorSchema,
  conditionValueTypeSchema,
  numericOperatorSchema,
  stringOperatorSchema,
  valuelessOperatorSchema,
  type AnyValueCondition,
  type AttributeOperator,
  type Condition,
} from "@railswitch/schemas";

import { isOneOf, type ArrayMoveDirection } from "../../../utils/array";
import { AppIcon } from "../../AppIcon";
import {
  OPERATOR_OPTIONS,
  VALUE_TYPE_DEFAULT_VALUES,
  VALUE_TYPE_OPTIONS,
} from "./constants";

type RuleEditorConditionProps = {
  condition: Condition;
  updateCondition: (newCondition: Condition) => void;
  deleteCondition: () => void;
  moveCondition: (dir: ArrayMoveDirection) => void;
};

function hasOperatorIn<O extends AttributeOperator>(
  condition: Condition,
  operators: readonly O[],
): condition is Extract<Condition, { operator: O }> {
  return isOneOf(operators, condition.operator);
}

function withOperator(
  condition: Condition,
  operator: AttributeOperator,
): Condition {
  const { type, attribute } = condition;
  const currentValue = "value" in condition ? condition.value : undefined;

  if (isOneOf(valuelessOperatorSchema.options, operator)) {
    return { type, attribute, operator };
  }

  if (isOneOf(numericOperatorSchema.options, operator)) {
    return {
      type,
      attribute,
      operator,
      value:
        typeof currentValue === "number"
          ? currentValue
          : VALUE_TYPE_DEFAULT_VALUES.number,
    };
  }

  if (isOneOf(stringOperatorSchema.options, operator)) {
    return {
      type,
      attribute,
      operator,
      value:
        typeof currentValue === "string"
          ? currentValue
          : VALUE_TYPE_DEFAULT_VALUES.string,
    };
  }

  return {
    type,
    attribute,
    operator,
    value: currentValue ?? VALUE_TYPE_DEFAULT_VALUES.string,
  };
}

function renderAnyValueInputs(
  condition: AnyValueCondition,
  updateCondition: (newCondition: Condition) => void,
) {
  const updateValueType = (newValueType: string) => {
    const parsed = conditionValueTypeSchema.safeParse(newValueType);
    if (!parsed.success) {
      return;
    }

    updateCondition({
      ...condition,
      value: VALUE_TYPE_DEFAULT_VALUES[parsed.data],
    });
  };

  return (
    <>
      <Selector
        options={VALUE_TYPE_OPTIONS}
        value={typeof condition.value}
        label="Value type"
        isLabelHidden
        onChange={updateValueType}
      />
      {renderAnyValueInput(condition, updateCondition)}
    </>
  );
}

function renderAnyValueInput(
  condition: AnyValueCondition,
  updateCondition: (newCondition: Condition) => void,
) {
  if (typeof condition.value === "boolean") {
    return (
      <Switch
        value={condition.value}
        label="Value"
        onChange={(value) => updateCondition({ ...condition, value })}
      />
    );
  }

  if (typeof condition.value === "number") {
    return (
      <NumberInput
        value={condition.value}
        label="Value"
        placeholder="Value"
        isLabelHidden
        onChange={(value) => updateCondition({ ...condition, value })}
      />
    );
  }

  return (
    <TextInput
      value={condition.value}
      label="Value"
      placeholder="Value"
      isLabelHidden
      onChange={(value) => updateCondition({ ...condition, value })}
    />
  );
}

export function RuleEditorCondition({
  condition,
  updateCondition,
  deleteCondition,
  moveCondition,
}: RuleEditorConditionProps) {
  const updateConditionOperator = (newOperator: string) => {
    const parsed = attributeOperatorSchema.safeParse(newOperator);
    if (!parsed.success) {
      return;
    }

    updateCondition(withOperator(condition, parsed.data));
  };

  const renderValueInput = () => {
    if (hasOperatorIn(condition, valuelessOperatorSchema.options)) {
      return null;
    }

    if (hasOperatorIn(condition, numericOperatorSchema.options)) {
      return (
        <NumberInput
          value={condition.value}
          label="Value"
          placeholder="Value"
          isLabelHidden
          onChange={(value) => updateCondition({ ...condition, value })}
        />
      );
    }

    if (hasOperatorIn(condition, stringOperatorSchema.options)) {
      return (
        <TextInput
          value={condition.value}
          label="Value"
          placeholder="Value"
          isLabelHidden
          onChange={(value) => updateCondition({ ...condition, value })}
        />
      );
    }

    return renderAnyValueInputs(condition, updateCondition);
  };

  return (
    <HStack gap={2} align="center">
      <StackItem size="fill">
        <TextInput
          value={condition.attribute}
          label="Attribute"
          placeholder="Attribute"
          isLabelHidden
          onChange={(value) =>
            updateCondition({ ...condition, attribute: value })
          }
        />
      </StackItem>
      <Selector
        options={OPERATOR_OPTIONS}
        value={condition.operator}
        label="Operator"
        isLabelHidden
        onChange={updateConditionOperator}
      />
      {renderValueInput()}
      <MoreMenu
        items={[
          {
            label: "Move condition up",
            icon: <AppIcon icon="chevronUp" />,
            onClick: () => moveCondition("up"),
          },
          {
            label: "Move condition down",
            icon: <AppIcon icon="chevronDown" />,
            onClick: () => moveCondition("down"),
          },
          { type: "divider" },
          {
            label: "Delete rule",
            icon: <AppIcon icon="trash" />,
            variant: "destructive",
            onClick: deleteCondition,
          },
        ]}
      />
    </HStack>
  );
}
