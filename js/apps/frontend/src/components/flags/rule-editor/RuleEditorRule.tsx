import { Button } from "@astryxdesign/core/Button";
import { ButtonGroup } from "@astryxdesign/core/ButtonGroup";
import { Card } from "@astryxdesign/core/Card";
import { Divider } from "@astryxdesign/core/Divider";
import { HStack } from "@astryxdesign/core/HStack";
import { IconButton } from "@astryxdesign/core/IconButton";
import { Layout, LayoutContent, LayoutHeader } from "@astryxdesign/core/Layout";
import { NumberInput } from "@astryxdesign/core/NumberInput";
import { Selector } from "@astryxdesign/core/Selector";
import { StackItem } from "@astryxdesign/core/Stack";
import { Switch } from "@astryxdesign/core/Switch";
import { Text } from "@astryxdesign/core/Text";
import { TextInput } from "@astryxdesign/core/TextInput";
import { colorVars, spacingVars } from "@astryxdesign/core/theme/tokens.stylex";
import { Tooltip } from "@astryxdesign/core/Tooltip";
import { VStack } from "@astryxdesign/core/VStack";
import * as Sentry from "@sentry/react";
import * as stylex from "@stylexjs/stylex";
import { useState } from "react";

import {
  combinatorOperatorSchema,
  type ConditionOrGroup,
  type Rule,
  type RuleValueResultValue,
  type RuleValueResultValueType,
} from "@railswitch/schemas";

import {
  moveArrayElement,
  removeArrayElementAtIndex,
  type ArrayMoveDirection,
} from "../../../utils/array";
import { AppIcon } from "../../AppIcon";
import { COMBINATOR_OPTIONS } from "./constants";
import { RuleEditorConditionOrGroup } from "./RuleEditorConditionOrGroup";

type RuleEditorRuleProps = {
  rule: Rule;
  rulesCount: number;
  ruleIndex: number;
  ruleReturnType: RuleValueResultValueType;
  deleteRule: () => void;
  updateRule: (newData: Rule) => void;
  moveRule: (dir: ArrayMoveDirection) => void;
};

const styles = stylex.create({
  ruleEditorRuleHeader: {
    backgroundColor: colorVars["--color-background-muted"],
  },
  ruleEditorRuleBody: {
    backgroundColor: colorVars["--color-background-body"],
  },
  whenHeader: {
    paddingTop: spacingVars["--spacing-1-5"],
  },
  uppercaseText: {
    textTransform: "uppercase",
  },
  verticalDivider: {
    height: "auto",
    alignSelf: "stretch",
  },
});

export function RuleEditorRule({
  rule,
  rulesCount,
  ruleIndex,
  ruleReturnType,
  deleteRule,
  updateRule,
  moveRule,
}: RuleEditorRuleProps) {
  const [isOpen, setIsOpen] = useState(false);

  const updateRootCombinator = (newCombinator: string) => {
    const parsed = combinatorOperatorSchema.safeParse(newCombinator);
    if (!parsed.success) {
      return;
    }
    updateRule({
      ...rule,
      conditions: { ...rule.conditions, combinator: parsed.data },
    });
  };
  const addNewCondition = () => {
    updateRule({
      ...rule,
      conditions: {
        ...rule.conditions,
        conditions: [
          ...rule.conditions.conditions,
          {
            type: "attribute",
            attribute: "",
            operator: "eq",
            value: "",
          },
        ],
      },
    });
  };
  const addNewConditionGroup = () => {
    updateRule({
      ...rule,
      conditions: {
        ...rule.conditions,
        conditions: [
          ...rule.conditions.conditions,
          {
            combinator: "and",
            conditions: [],
          },
        ],
      },
    });
  };
  const updateNestedConditionOrGroup = (
    conditionOrGroupIndex: number,
    newConditionOrGroup: ConditionOrGroup,
  ) => {
    updateRule({
      ...rule,
      conditions: {
        ...rule.conditions,
        conditions: rule.conditions.conditions.with(
          conditionOrGroupIndex,
          newConditionOrGroup,
        ),
      },
    });
  };
  const deleteNestedConditionOrGroup = (conditionOrGroupIndex: number) => {
    updateRule({
      ...rule,
      conditions: {
        ...rule.conditions,
        conditions: removeArrayElementAtIndex(
          rule.conditions.conditions,
          conditionOrGroupIndex,
        ),
      },
    });
  };
  const moveNestedConditionOrGroup = (
    conditionOrGroupToMoveIndex: number,
    dir: ArrayMoveDirection,
  ) => {
    try {
      updateRule({
        ...rule,
        conditions: {
          ...rule.conditions,
          conditions: moveArrayElement(
            rule.conditions.conditions,
            conditionOrGroupToMoveIndex,
            dir,
          ),
        },
      });
    } catch (error) {
      console.error("Error while moving rule:", error);
      Sentry.captureException(error);
    }
  };
  const handleRuleReturnValueChange = (value: RuleValueResultValue) => {
    updateRule({
      ...rule,
      result: {
        ...rule.result,
        value,
      },
    });
  };

  const toggleOpen = () => {
    setIsOpen((prev) => !prev);
  };
  const toggleRuleLabel = isOpen ? "Close rule" : "Open rule";

  const getReturnInput = (returnType: RuleValueResultValueType) => {
    switch (returnType) {
      case "string": {
        return (
          <TextInput
            label="Rule return value"
            placeholder="Rule return value..."
            isLabelHidden
            value={String(rule.result.value)}
            onChange={handleRuleReturnValueChange}
          />
        );
      }
      case "number": {
        return (
          <NumberInput
            label="Rule return value"
            placeholder="Rule return value..."
            isLabelHidden
            value={Number(rule.result.value)}
            onChange={handleRuleReturnValueChange}
          />
        );
      }
      case "boolean": {
        return (
          <Switch
            label="Rule return value"
            isLabelHidden
            value={Boolean(rule.result.value)}
            onChange={handleRuleReturnValueChange}
          />
        );
      }
    }
  };

  const content = isOpen ? (
    <LayoutContent xstyle={styles.ruleEditorRuleBody}>
      <VStack gap={2}>
        <HStack gap={4}>
          <Text
            type="supporting"
            xstyle={[styles.uppercaseText, styles.whenHeader]}
          >
            When
          </Text>

          <StackItem size="fill">
            <VStack gap={2}>
              <HStack align="center" gap={1}>
                <Selector
                  options={COMBINATOR_OPTIONS}
                  value={rule.conditions.combinator}
                  label="Rule combinator"
                  isLabelHidden
                  onChange={updateRootCombinator}
                />
                <Text type="supporting">of the following match</Text>
              </HStack>
              <VStack gap={1}>
                {rule.conditions.conditions.map((conditionOrGroup, index) => (
                  <RuleEditorConditionOrGroup
                    key={index}
                    conditionOrGroup={conditionOrGroup}
                    updateConditionOrGroup={(newConditionOrGroup) =>
                      updateNestedConditionOrGroup(index, newConditionOrGroup)
                    }
                    deleteConditionOrGroup={() =>
                      deleteNestedConditionOrGroup(index)
                    }
                    moveConditionOrGroup={(dir) =>
                      moveNestedConditionOrGroup(index, dir)
                    }
                  />
                ))}
              </VStack>
              <HStack gap={2}>
                <Button
                  label="Add condition"
                  icon={<AppIcon icon="add" />}
                  onClick={addNewCondition}
                >
                  Condition
                </Button>
                <Button
                  label="Add condition group"
                  icon={<AppIcon icon="add" />}
                  onClick={addNewConditionGroup}
                >
                  Group
                </Button>
              </HStack>
            </VStack>
          </StackItem>
        </HStack>
        <Divider />
        <HStack gap={4} align="center">
          <Text type="supporting" xstyle={styles.uppercaseText}>
            Then
          </Text>
          <StackItem size="fill">
            <HStack gap={2} align="center">
              <Text type="supporting">return</Text>
              <StackItem size="fill">
                {getReturnInput(ruleReturnType)}
              </StackItem>
            </HStack>
          </StackItem>
        </HStack>
      </VStack>
    </LayoutContent>
  ) : null;

  return (
    <Card>
      <Layout
        header={
          <LayoutHeader hasDivider xstyle={styles.ruleEditorRuleHeader}>
            <HStack align="center" gap={4}>
              <ButtonGroup label="Rule movement controls">
                <Tooltip content="Move rule down">
                  <IconButton
                    icon={<AppIcon icon="chevronDown" />}
                    label="Move rule down"
                    isDisabled={ruleIndex === rulesCount - 1}
                    onClick={() => moveRule("down")}
                  />
                </Tooltip>
                <Tooltip content="Move rule up">
                  <IconButton
                    icon={<AppIcon icon="chevronUp" />}
                    label="Move rule up"
                    isDisabled={ruleIndex === 0}
                    onClick={() => moveRule("up")}
                  />
                </Tooltip>
              </ButtonGroup>
              <Text type="supporting" xstyle={styles.uppercaseText}>
                Rule {ruleIndex + 1}
              </Text>
              <StackItem size="fill">
                <TextInput
                  label={`Rule ${ruleIndex + 1} description`}
                  placeholder="Rule description"
                  isLabelHidden
                  value={rule.description ?? ""}
                  onChange={(newDescription) =>
                    updateRule({ ...rule, description: newDescription })
                  }
                />
              </StackItem>
              <Switch
                value={rule.enabled}
                label="Enabled"
                onChange={(newEnabled) =>
                  updateRule({ ...rule, enabled: newEnabled })
                }
              />
              <HStack align="center" gap={1}>
                <Divider
                  orientation="vertical"
                  xstyle={styles.verticalDivider}
                />
                <Tooltip content="Delete rule">
                  <IconButton
                    variant="ghost"
                    icon={<AppIcon icon="trash" />}
                    label="Delete rule"
                    isDisabled={rulesCount === 1}
                    onClick={deleteRule}
                  />
                </Tooltip>
                <Divider
                  orientation="vertical"
                  xstyle={styles.verticalDivider}
                />
                <Tooltip content={toggleRuleLabel}>
                  <IconButton
                    variant="ghost"
                    icon={
                      isOpen ? (
                        <AppIcon icon="chevronUp" />
                      ) : (
                        <AppIcon icon="chevronDown" />
                      )
                    }
                    label={toggleRuleLabel}
                    onClick={toggleOpen}
                  />
                </Tooltip>
              </HStack>
            </HStack>
          </LayoutHeader>
        }
        content={content}
      />
    </Card>
  );
}
