import { Button } from "@astryxdesign/core/Button";
import { Card } from "@astryxdesign/core/Card";
import { useImperativeDialog } from "@astryxdesign/core/Dialog";
import { Divider } from "@astryxdesign/core/Divider";
import { HStack } from "@astryxdesign/core/HStack";
import { Text } from "@astryxdesign/core/Text";
import * as Sentry from "@sentry/react";
import * as stylex from "@stylexjs/stylex";
import { useState } from "react";

import { type Rule, type RuleValueResultValueType } from "@railswitch/schemas";

import {
  moveArrayElement,
  removeArrayElementAtIndex,
  type ArrayMoveDirection,
} from "../../../utils/array";
import { parseRules } from "../../../utils/rule";
import { AppIcon } from "../../AppIcon";
import { RESULT_TYPE_DEFAULT_VALUES } from "./constants";
import { RuleEditorChangeReturnTypeDialog } from "./RuleEditorChangeReturnTypeDialog";
import { RuleEditorRule } from "./RuleEditorRule";

type RuleEditorProps = {
  value: string;
  onChange: (value: string) => void;
};

type DraftRules = {
  resultType: RuleValueResultValueType;
  rules: Rule[];
};

const styles = stylex.create({
  uppercaseText: {
    textTransform: "uppercase",
  },
});

const createNewRule = (type: RuleValueResultValueType): Rule => ({
  description: "New rule",
  enabled: false,
  conditions: {
    combinator: "and",
    conditions: [],
  },
  result: {
    type: "value",
    value: RESULT_TYPE_DEFAULT_VALUES[type],
  },
});

export function RuleEditor({ value, onChange }: RuleEditorProps) {
  const [draftRules, setDraftRules] = useState<DraftRules | null>(() =>
    parseRules(value),
  );
  const [lastValue, setLastValue] = useState(value);
  const changeReturnTypeDialog = useImperativeDialog({
    purpose: "form",
    width: 600,
  });

  if (value !== lastValue) {
    setLastValue(value);
    setDraftRules(parseRules(value));
  }

  const commitRules = (newRules: DraftRules) => {
    const serializedRules = JSON.stringify(newRules);

    setDraftRules(newRules);
    setLastValue(serializedRules);
    onChange(serializedRules);
  };

  const addNewRule = () => {
    if (draftRules == null) {
      return;
    }

    commitRules({
      ...draftRules,
      rules: [...draftRules.rules, createNewRule(draftRules.resultType)],
    });
  };

  const deleteRule = (ruleIndex: number) => {
    if (draftRules == null) {
      return;
    }

    commitRules({
      ...draftRules,
      rules: removeArrayElementAtIndex(draftRules.rules, ruleIndex),
    });
  };

  const updateRuleAtIndex = (ruleIndex: number, updateData: Rule) => {
    if (draftRules == null) {
      return;
    }

    commitRules({
      ...draftRules,
      rules: draftRules.rules.with(ruleIndex, updateData),
    });
  };

  const moveRuleAtIndex = (ruleIndex: number, dir: ArrayMoveDirection) => {
    if (draftRules == null) {
      return;
    }

    try {
      commitRules({
        ...draftRules,
        rules: moveArrayElement(draftRules.rules, ruleIndex, dir),
      });
    } catch (error) {
      console.error("Error while moving rule:", error);
      Sentry.captureException(error);
    }
  };

  const handleRuleResultTypeChange = (newType: RuleValueResultValueType) => {
    if (draftRules == null) {
      return;
    }

    commitRules({
      ...draftRules,
      resultType: newType,
      rules: draftRules.rules.map((rule) => {
        return {
          ...rule,
          result: {
            ...rule.result,
            value: RESULT_TYPE_DEFAULT_VALUES[newType],
          },
        };
      }),
    });
  };

  return (
    <>
      <HStack justify="between" align="center">
        <span>
          <Text type="supporting" xstyle={styles.uppercaseText}>
            Result type{" "}
          </Text>
          <Text type="code" weight="medium" size="sm">
            {draftRules?.resultType}
          </Text>
        </span>
        <Button
          label="Change result type"
          variant="destructive"
          onClick={() => {
            if (draftRules == null) {
              return;
            }

            changeReturnTypeDialog.show(
              <RuleEditorChangeReturnTypeDialog
                onClose={() => changeReturnTypeDialog.hide()}
                currentType={draftRules.resultType}
                onChangeType={handleRuleResultTypeChange}
              />,
            );
          }}
        />
      </HStack>
      <Divider />
      {draftRules?.rules.map((rule, index) => (
        <RuleEditorRule
          key={index}
          rule={rule}
          ruleIndex={index}
          rulesCount={draftRules.rules.length}
          ruleReturnType={draftRules.resultType}
          deleteRule={() => deleteRule(index)}
          updateRule={(value) => updateRuleAtIndex(index, value)}
          moveRule={(dir) => {
            moveRuleAtIndex(index, dir);
          }}
        />
      ))}
      <Button
        label="Add rule"
        icon={<AppIcon icon="plus" />}
        onClick={addNewRule}
      />
      <Card variant="muted">
        <HStack gap={2}>
          <AppIcon icon="info" />
          <Text type="supporting">
            Rules are evaluated top to bottom. If no rule matches, then the
            fallback value wille be returned, which is described in code.
          </Text>
        </HStack>
      </Card>
      {changeReturnTypeDialog.element}
    </>
  );
}
