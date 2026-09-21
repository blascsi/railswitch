import { Button } from "@astryxdesign/core/Button";
import { FormLayout } from "@astryxdesign/core/FormLayout";
import {
  Card,
  Layout,
  LayoutContent,
  LayoutFooter,
} from "@astryxdesign/core/Layout";
import { HStack, Stack } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";
import { colorVars } from "@astryxdesign/core/theme/tokens.stylex";
import * as stylex from "@stylexjs/stylex";
import { useState, type ReactNode } from "react";
import { useMutation } from "urql";

import { useAppForm } from "../../forms/formHook";
import { graphql } from "../../graphql/graphql";
import {
  getSubmissionErrors,
  noSubmissionErrors,
  unexpectedSubmissionError,
} from "../../utils/apiErrorMessage";
import { areRulesEqual, formatRules, validateRules } from "../../utils/rule";
import { AppIcon } from "../AppIcon";
import { RuleEditor } from "./rule-editor";

const UpdateFlagEnvironmentMutation = graphql(`
  mutation UpdateFlagEnvironmentMutation(
    $id: ID!
    $input: UpdateFlagEnvironmentInput!
  ) {
    updateFlagEnvironment(id: $id, input: $input) {
      result {
        id
        rules
      }
      errors {
        message
        fields
      }
    }
  }
`);

const styles = stylex.create({
  headerFooter: {
    backgroundColor: colorVars["--color-background-muted"],
  },
});

type FlagEnvironmentRulesFormProps = {
  flagEnvironmentId: string;
  rules: string;
  header: ReactNode;
};

export function FlagEnvironmentRulesForm({
  flagEnvironmentId,
  rules,
  header,
}: FlagEnvironmentRulesFormProps) {
  const [{ fetching }, updateRule] = useMutation(UpdateFlagEnvironmentMutation);
  const [savedRules, setSavedRules] = useState(rules);
  const initialRules = formatRules(savedRules);

  const form = useAppForm({
    defaultValues: { rules: initialRules },
    onSubmit: async ({ value, formApi }) => {
      formApi.setErrorMap({ onSubmit: noSubmissionErrors });

      try {
        const { data, error } = await updateRule({
          id: flagEnvironmentId,
          input: { rules: value.rules },
        });

        if (data?.updateFlagEnvironment.result != null) {
          setSavedRules(data.updateFlagEnvironment.result.rules);
          formApi.reset(value, { keepDefaultValues: true });
          return;
        }

        formApi.setErrorMap({
          onSubmit: getSubmissionErrors(
            error,
            data?.updateFlagEnvironment.errors,
          ),
        });
      } catch {
        formApi.setErrorMap({ onSubmit: unexpectedSubmissionError });
      }
    },
  });

  return (
    <Card>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void form.handleSubmit();
        }}
      >
        <Layout
          header={header}
          content={
            <LayoutContent>
              <Stack gap={4}>
                <FormLayout>
                  <form.AppField
                    name="rules"
                    validators={{
                      onBlur: ({ value }) => validateRules(value),
                      onSubmit: ({ value }) => validateRules(value),
                    }}
                  >
                    {(field) => (
                      <RuleEditor
                        value={field.state.value}
                        onChange={field.handleChange}
                      />
                    )}
                  </form.AppField>
                </FormLayout>
              </Stack>
            </LayoutContent>
          }
          footer={
            <LayoutFooter hasDivider xstyle={styles.headerFooter}>
              <form.AppForm>
                <form.Subscribe selector={(state) => state.values.rules}>
                  {(currentRules) => {
                    const hasPendingChanges = !areRulesEqual(
                      currentRules,
                      initialRules,
                    );

                    return (
                      <HStack justify="between" align="center" gap={3}>
                        {hasPendingChanges ? (
                          <Text type="supporting">Unsaved changes</Text>
                        ) : (
                          <span />
                        )}
                        <Stack
                          direction="horizontal"
                          hAlign="end"
                          vAlign="center"
                          gap={3}
                          wrap="wrap"
                        >
                          <form.FormError />
                          <Button
                            label="Reset"
                            variant="secondary"
                            icon={<AppIcon icon="arrowCounterClockwise" />}
                            isDisabled={!hasPendingChanges}
                            onClick={() => {
                              form.reset(
                                { rules: initialRules },
                                { keepDefaultValues: true },
                              );
                            }}
                          />
                          <form.SubmitButton
                            label="Update"
                            isPending={fetching}
                            requiresChanges
                          />
                        </Stack>
                      </HStack>
                    );
                  }}
                </form.Subscribe>
              </form.AppForm>
            </LayoutFooter>
          }
        />
      </form>
    </Card>
  );
}
