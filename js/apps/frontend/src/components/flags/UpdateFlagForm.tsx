import { FormLayout } from "@astryxdesign/core/FormLayout";
import { Stack } from "@astryxdesign/core/Stack";
import { rulesSchema } from "@railswitch/schemas";
import { useEffect, useState } from "react";
import { useMutation, useQuery } from "urql";
import { useAppForm } from "../../forms/formHook";
import { type FragmentOf, graphql, readFragment } from "../../graphql/graphql";
import {
  getSubmissionErrors,
  noSubmissionErrors,
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
      environments(sort: [{field: NAME, order: ASC}]) {
        id
        ...environmentSelector_environments
      }
    }
  }
`,
  [environmentSelector_environments],
);

const FlagEnvironmentQuery = graphql(`
  query FlagEnvironmentQuery($flag: FlagEnvironmentFilterFlagId!, $environment: FlagEnvironmentFilterEnvironmentId!) {
    listFlagEnvironments(filter: {environmentId: $environment, flagId: $flag}) {
      results {
        id
        rules
      }
    }
  }
`);

const UpdateFlagEnvironmentMutation = graphql(`
  mutation UpdateFlagEnvironmentMutation($id: ID!, $input: UpdateFlagEnvironmentInput!) {
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
    <Stack gap={4}>
      <EnvironmentSelector
        label="Environment"
        environments={environments}
        value={selectedEnvironment ?? undefined}
        onChange={setSelectedEnvironment}
      />

      <form
        onSubmit={(event) => {
          event.preventDefault();
          form.handleSubmit();
        }}
      >
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
        </Stack>
      </form>
    </Stack>
  );
}
