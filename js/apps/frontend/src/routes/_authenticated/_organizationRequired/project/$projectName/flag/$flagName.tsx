import { EmptyState } from "@astryxdesign/core/EmptyState";
import { FormLayout } from "@astryxdesign/core/FormLayout";
import { Icon } from "@astryxdesign/core/Icon";
import { Stack } from "@astryxdesign/core/Stack";
import { Heading, Text } from "@astryxdesign/core/Text";
import { FlagIcon } from "@phosphor-icons/react";
import { rulesSchema } from "@railswitch/schemas";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery } from "urql";
import {
  EnvironmentSelector,
  environmentSelector_environments,
} from "../../../../../../components/environments/EnvironmentSelector";
import { CenteredContent } from "../../../../../../components/layout/CenteredContent";
import { LinkAnchor } from "../../../../../../components/routing/link-components/LinkAnchor";
import { useAppForm } from "../../../../../../forms/formHook";
import { graphql } from "../../../../../../graphql/graphql";
import {
  getSubmissionErrors,
  noSubmissionErrors,
} from "../../../../../../utils/apiErrorMessage";
import { pageTitle } from "../../../../../../utils/pageTitle";

const FlagUpdatePageQuery = graphql(
  `
  query FlagUpdatePageQuery($projectName: String!, $flagName: String!) {
    getFlagByName(projectName: $projectName, flagName: $flagName) {
      id
      name
      project {
        id
        name
        environments(sort: [{field: NAME, order: ASC}]) {
          id
          ...environmentSelector_environments
        }
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

export const Route = createFileRoute(
  "/_authenticated/_organizationRequired/project/$projectName/flag/$flagName",
)({
  loader: async ({ context, params }) => {
    const { data, error } = await context.client
      .query(FlagUpdatePageQuery, {
        projectName: params.projectName,
        flagName: params.flagName,
      })
      .toPromise();

    if (data == null) {
      throw error;
    }

    const flag = data.getFlagByName;

    if (flag == null) {
      throw notFound();
    }

    return { flag };
  },
  head: ({ loaderData }) => ({
    meta: [{ title: pageTitle(loaderData?.flag.name) }],
  }),
  component: FlagUpdatePage,
  notFoundComponent: FlagNotFound,
});

function FlagNotFound() {
  return (
    <CenteredContent>
      <EmptyState
        icon={<Icon icon={FlagIcon} size="lg" />}
        title="Flag not found"
        description="Please double check if you are in the right organization"
      />
    </CenteredContent>
  );
}

function FlagUpdatePage() {
  const loaderData = Route.useLoaderData();
  const { flag } = loaderData;
  const [selectedEnvironment, setSelectedEnvironment] = useState<string | null>(
    flag.project.environments?.[0]?.id ?? null,
  );
  const [flagEnvironments] = useQuery({
    query: FlagEnvironmentQuery,
    variables: {
      flag: { eq: flag.id },
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
      <Stack gap={3}>
        <Heading level={1}>Update flag</Heading>
        <Text type="supporting">Name</Text>
        <Text>{flag.name}</Text>
        <Text type="supporting">Owning project</Text>
        <LinkAnchor
          to="/project/$projectName"
          params={{ projectName: flag.project.name }}
        >
          {flag.project.name}
        </LinkAnchor>
        <EnvironmentSelector
          label="Environment"
          environments={flag.project.environments}
          value={selectedEnvironment ?? undefined}
          onChange={setSelectedEnvironment}
        />
      </Stack>

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
              validators={{ onBlur: ({ value }) => validateRules(value) }}
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
