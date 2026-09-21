import { Button } from "@astryxdesign/core/Button";
import { DialogHeader } from "@astryxdesign/core/Dialog";
import { Layout, LayoutContent, LayoutFooter } from "@astryxdesign/core/Layout";
import { Selector } from "@astryxdesign/core/Selector";
import { HStack, VStack } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";
import { useState } from "react";

import {
  ruleValueResultValueTypeSchema,
  type RuleValueResultValueType,
} from "@railswitch/schemas";

import { RESULT_TYPE_OPTIONS } from "./constants";

type RuleEditorChangeReturnTypeDialogProps = {
  onClose: () => void;
  currentType: RuleValueResultValueType;
  onChangeType: (newType: RuleValueResultValueType) => void;
};

export function RuleEditorChangeReturnTypeDialog({
  onClose,
  currentType,
  onChangeType,
}: RuleEditorChangeReturnTypeDialogProps) {
  const [newType, setNewType] = useState<RuleValueResultValueType>();
  const resultTypeOptions = RESULT_TYPE_OPTIONS.filter(
    (option) => option.value !== currentType,
  );
  const handleTypeChange = (newType: string) => {
    const parsed = ruleValueResultValueTypeSchema.safeParse(newType);
    if (parsed.success) {
      setNewType(parsed.data);
    }
  };
  const handleTypeChangeConfirm = () => {
    if (newType == null) {
      return;
    }

    onChangeType(newType);
    onClose();
  };

  return (
    <Layout
      header={<DialogHeader title="Change flag return type" hasDivider />}
      content={
        <LayoutContent>
          <VStack gap={2}>
            <Text>
              All return values of the flag will be set to the new type's
              default (empty string for strings, 0 for numbers, and false for
              booleans), and will need to be updated manually. The hard coded
              fallback value in your code won't change.
            </Text>
            <Selector
              isLabelHidden
              label="New type"
              placeholder="New type..."
              options={resultTypeOptions}
              value={newType}
              onChange={handleTypeChange}
            />
          </VStack>
        </LayoutContent>
      }
      footer={
        <LayoutFooter hasDivider>
          <HStack justify="end" gap={2}>
            <Button label="Cancel" variant="ghost" onClick={onClose} />
            <Button
              label="Change"
              variant="destructive"
              onClick={handleTypeChangeConfirm}
            />
          </HStack>
        </LayoutFooter>
      }
    />
  );
}
