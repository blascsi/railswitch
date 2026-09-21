import type { ConditionOrGroup } from "@railswitch/schemas";

import type { ArrayMoveDirection } from "../../../utils/array";
import { RuleEditorCondition } from "./RuleEditorCondition";
import { RuleEditorConditionGroup } from "./RuleEditorConditionGroup";

type RuleEditorConditionOrGroupProps = {
  conditionOrGroup: ConditionOrGroup;
  updateConditionOrGroup: (newData: ConditionOrGroup) => void;
  deleteConditionOrGroup: () => void;
  moveConditionOrGroup: (dir: ArrayMoveDirection) => void;
};

export function RuleEditorConditionOrGroup({
  conditionOrGroup,
  updateConditionOrGroup,
  deleteConditionOrGroup,
  moveConditionOrGroup,
}: RuleEditorConditionOrGroupProps) {
  if ("combinator" in conditionOrGroup) {
    return (
      <RuleEditorConditionGroup
        conditionGroup={conditionOrGroup}
        updateGroup={updateConditionOrGroup}
        deleteGroup={deleteConditionOrGroup}
        moveGroup={moveConditionOrGroup}
      />
    );
  } else {
    return (
      <RuleEditorCondition
        condition={conditionOrGroup}
        updateCondition={updateConditionOrGroup}
        deleteCondition={deleteConditionOrGroup}
        moveCondition={moveConditionOrGroup}
      />
    );
  }
}
