import { Divider } from "@astryxdesign/core/Divider";
import { FieldLabel } from "@astryxdesign/core/Field";
import { FormLayout } from "@astryxdesign/core/FormLayout";
import {
  Card,
  Layout,
  LayoutContent,
  LayoutFooter,
  LayoutHeader,
} from "@astryxdesign/core/Layout";
import { HStack, Stack } from "@astryxdesign/core/Stack";
import { colorVars } from "@astryxdesign/core/theme/tokens.stylex";
import * as stylex from "@stylexjs/stylex";
import { useEffect, useState } from "react";
import { useMutation, useQuery } from "urql";

import { rulesSchema } from "@railswitch/schemas";

import { useAppForm } from "../../forms/formHook";
import { graphql, readFragment, type FragmentOf } from "../../graphql/graphql";
import {
  getSubmissionErrors,
  noSubmissionErrors,
  unexpectedSubmissionError,
} from "../../utils/apiErrorMessage";
import {
  EnvironmentSelector,
  environmentSelector_environments,
} from "../environments/EnvironmentSelector";

export const updateFlagForm_flag = graphql(
  `
    fragment updateFlagForm_flag on Flag {
      id
      project {
        environments(sort: [{ field: NAME, order: ASC }]) {
          id
          ...environmentSelector_environments
        }
      }
    }
  `,
  [environmentSelector_environments],
);

const FlagEnvironmentQuery = graphql(`
  query FlagEnvironmentQuery(
    $flag: FlagEnvironmentFilterFlagId!
    $environment: FlagEnvironmentFilterEnvironmentId!
  ) {
    listFlagEnvironments(
      filter: { environmentId: $environment, flagId: $flag }
    ) {
      results {
        id
        rules
      }
    }
  }
`);

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
  verticalDivider: {
    height: "auto",
    alignSelf: "stretch",
  },
});

function formatRules(rules: string) {
  try {
    return JSON.stringify(JSON.parse(rules), null, 2);
  } catch {
    return rules;
  }
}

function validateRules(rules: string) {
  let parsed: unknown;

  try {
    parsed = JSON.parse(rules);
  } catch {
    return "Rules must be valid JSON";
  }

  const result = rulesSchema.safeParse(parsed);

  return result.success
    ? undefined
    : (result.error.issues[0]?.message ?? "Invalid rule configuration");
}

type UpdateFlagFormProps = {
  flag: FragmentOf<typeof updateFlagForm_flag>;
};

export function UpdateFlagForm({ flag }: UpdateFlagFormProps) {
  const { id: flagId, project } = readFragment(updateFlagForm_flag, flag);
  const environments = project.environments;
  const [selectedEnvironment, setSelectedEnvironment] = useState<string | null>(
    environments?.[0]?.id ?? null,
  );
  const [flagEnvironments] = useQuery({
    query: FlagEnvironmentQuery,
    variables: {
      flag: { eq: flagId },
      environment: { eq: selectedEnvironment },
    },
    pause: selectedEnvironment == null,
  });
  const [{ fetching }, updateRule] = useMutation(UpdateFlagEnvironmentMutation);
  const flagEnvironmentId =
    flagEnvironments.data?.listFlagEnvironments?.results?.[0]?.id;
  const environmentRules =
    flagEnvironments.data?.listFlagEnvironments?.results?.[0]?.rules;

  const form = useAppForm({
    defaultValues: { rules: "" },
    onSubmit: async ({ value, formApi }) => {
      formApi.setErrorMap({ onSubmit: noSubmissionErrors });

      try {
        const { data, error } = await updateRule({
          id: flagEnvironmentId ?? "",
          input: { rules: value.rules },
        });

        if (data?.updateFlagEnvironment.result != null) {
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

  useEffect(() => {
    if (environmentRules == null) {
      return;
    }

    form.reset(
      { rules: formatRules(environmentRules) },
      { keepDefaultValues: true },
    );
  }, [environmentRules, form]);

  return (
    <Card>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void form.handleSubmit();
        }}
      >
        <Layout
          header={
            <LayoutHeader hasDivider xstyle={styles.headerFooter}>
              <HStack gap={2}>
                <FieldLabel
                  inputID="environment_selector"
                  label="Environment"
                />
                <EnvironmentSelector
                  id="environment_selector"
                  label=""
                  isLabelHidden={true}
                  environments={environments}
                  value={selectedEnvironment ?? undefined}
                  onChange={setSelectedEnvironment}
                />
                <Divider
                  orientation="vertical"
                  variant="strong"
                  xstyle={styles.verticalDivider}
                />
                {/* TODO: Return type selector */}
              </HStack>
            </LayoutHeader>
          }
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
                      <field.TextArea
                        label="Environment configuration"
                        placeholder="Flag rule configuration for this environment..."
                        rows={10}
                        isLoading={flagEnvironments.fetching}
                        formatOnBlur={formatRules}
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
                <Stack
                  direction="horizontal"
                  hAlign="end"
                  vAlign="center"
                  gap={3}
                  wrap="wrap"
                >
                  <form.FormError />
                  <form.SubmitButton
                    label="Update"
                    isPending={fetching}
                    requiresChanges
                  />
                </Stack>
              </form.AppForm>
            </LayoutFooter>
          }
        />
      </form>
    </Card>
  );
}
