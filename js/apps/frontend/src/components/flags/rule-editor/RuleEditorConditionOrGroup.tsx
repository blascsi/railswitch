import type { ConditionOrGroup } from "@railswitch/schemas";

import type { ArrayMoveDirection } from "../../../utils/array";
import { RuleEditorCondition } from "./RuleEditorCondition";
import { RuleEditorConditionGroup } from "./RuleEditorConditionGroup";

type RuleEditorConditionOrGroupProps = {
  conditionOrGroup: ConditionOrGroup;
  conditionOrGroupIndex: number;
  conditionsCount: number;
  updateConditionOrGroup: (newData: ConditionOrGroup) => void;
  deleteConditionOrGroup: () => void;
  moveConditionOrGroup: (dir: ArrayMoveDirection) => void;
};

export function RuleEditorConditionOrGroup({
  conditionOrGroup,
  conditionOrGroupIndex,
  conditionsCount,
  updateConditionOrGroup,
  deleteConditionOrGroup,
  moveConditionOrGroup,
}: RuleEditorConditionOrGroupProps) {
  if ("combinator" in conditionOrGroup) {
    return (
      <RuleEditorConditionGroup
        conditionGroup={conditionOrGroup}
        groupIndex={conditionOrGroupIndex}
        conditionsCount={conditionsCount}
        updateGroup={updateConditionOrGroup}
        deleteGroup={deleteConditionOrGroup}
        moveGroup={moveConditionOrGroup}
      />
    );
  } else {
    return (
      <RuleEditorCondition
        condition={conditionOrGroup}
        conditionIndex={conditionOrGroupIndex}
        conditionsCount={conditionsCount}
        updateCondition={updateConditionOrGroup}
        deleteCondition={deleteConditionOrGroup}
        moveCondition={moveConditionOrGroup}
      />
    );
  }
}
