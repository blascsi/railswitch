import { Button } from "@astryxdesign/core/Button";
import { HStack } from "@astryxdesign/core/HStack";
import { MoreMenu } from "@astryxdesign/core/MoreMenu";
import { Selector } from "@astryxdesign/core/Selector";
import { StackItem } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";
import { VStack } from "@astryxdesign/core/VStack";
import * as Sentry from "@sentry/react";
import * as stylex from "@stylexjs/stylex";

import {
  combinatorOperatorSchema,
  type ConditionGroup,
  type ConditionOrGroup,
} from "@railswitch/schemas";

import {
  moveArrayElement,
  removeArrayElementAtIndex,
  type ArrayMoveDirection,
} from "../../../utils/array";
import { AppIcon } from "../../AppIcon";
import { COMBINATOR_OPTIONS } from "./constants";
import { RuleEditorConditionOrGroup } from "./RuleEditorConditionOrGroup";

type RuleEditorConditionGroupProps = {
  conditionGroup: ConditionGroup;
  updateGroup: (newGroup: ConditionGroup) => void;
  deleteGroup: () => void;
  moveGroup: (dir: ArrayMoveDirection) => void;
};

const styles = stylex.create({
  groupIndicator: {
    paddingLeft: 10,
    borderLeftWidth: 5,
    borderStyle: "solid",
    borderColor: "color-mix(in srgb, var(--color-accent), transparent 40%)",
  },
});

export function RuleEditorConditionGroup({
  conditionGroup,
  updateGroup,
  deleteGroup,
  moveGroup,
}: RuleEditorConditionGroupProps) {
  const updateGroupCombinator = (newCombinator: string) => {
    const parsed = combinatorOperatorSchema.safeParse(newCombinator);
    if (!parsed.success) {
      return;
    }

    updateGroup({
      ...conditionGroup,
      combinator: parsed.data,
    });
  };
  const updateNestedConditionOrGroup = (
    conditionOrGroupIndex: number,
    newConditionOrGroup: ConditionOrGroup,
  ) => {
    updateGroup({
      ...conditionGroup,
      conditions: conditionGroup.conditions.with(
        conditionOrGroupIndex,
        newConditionOrGroup,
      ),
    });
  };
  const deleteNestedConditionOrGroup = (conditionOrGroupIndex: number) => {
    updateGroup({
      ...conditionGroup,
      conditions: removeArrayElementAtIndex(
        conditionGroup.conditions,
        conditionOrGroupIndex,
      ),
    });
  };
  const moveNestedConditionOrGroup = (
    conditionOrGroupToMoveIndex: number,
    dir: ArrayMoveDirection,
  ) => {
    try {
      updateGroup({
        ...conditionGroup,
        conditions: moveArrayElement(
          conditionGroup.conditions,
          conditionOrGroupToMoveIndex,
          dir,
        ),
      });
    } catch (error) {
      console.error("Error while moving rule:", error);
      Sentry.captureException(error);
    }
  };
  const addNestedConditionGroup = () => {
    updateGroup({
      ...conditionGroup,
      conditions: [
        ...conditionGroup.conditions,
        { combinator: "and", conditions: [] },
      ],
    });
  };
  const addNestedCondition = () => {
    updateGroup({
      ...conditionGroup,
      conditions: [
        ...conditionGroup.conditions,
        { type: "attribute", attribute: "", operator: "eq", value: "" },
      ],
    });
  };

  return (
    <HStack xstyle={styles.groupIndicator}>
      <StackItem size="fill">
        <VStack gap={1}>
          <HStack justify="between">
            <HStack align="center" gap={1}>
              <Selector
                options={COMBINATOR_OPTIONS}
                value={conditionGroup.combinator}
                label="Group combinator"
                isLabelHidden
                onChange={updateGroupCombinator}
              />
              <Text type="supporting">of the following match</Text>
            </HStack>
            <MoreMenu
              items={[
                {
                  label: "Move group up",
                  icon: <AppIcon icon="chevronUp" />,
                  onClick: () => moveGroup("up"),
                },
                {
                  label: "Move group down",
                  icon: <AppIcon icon="chevronDown" />,
                  onClick: () => moveGroup("down"),
                },
                { type: "divider" },
                {
                  label: "Delete group",
                  icon: <AppIcon icon="trash" />,
                  variant: "destructive",
                  onClick: deleteGroup,
                },
              ]}
            />
          </HStack>
          {conditionGroup.conditions.map((conditionOrGroup, index) => (
            <RuleEditorConditionOrGroup
              key={index}
              conditionOrGroup={conditionOrGroup}
              updateConditionOrGroup={(newConditionOrGroup) =>
                updateNestedConditionOrGroup(index, newConditionOrGroup)
              }
              deleteConditionOrGroup={() => deleteNestedConditionOrGroup(index)}
              moveConditionOrGroup={(dir) =>
                moveNestedConditionOrGroup(index, dir)
              }
            />
          ))}
          <HStack gap={1}>
            <Button
              label="Add nested condition"
              size="sm"
              icon={<AppIcon icon="add" />}
              onClick={addNestedCondition}
            />
            <Button
              label="Add nested group"
              size="sm"
              icon={<AppIcon icon="add" />}
              onClick={addNestedConditionGroup}
            />
          </HStack>
        </VStack>
      </StackItem>
    </HStack>
  );
}
