import {
  Button,
  Container,
  EmptyState,
  Group,
  JsonInput,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { useForm } from "@mantine/form";
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
import { graphql } from "../../../../../../graphql/graphql";
import { getMutationFieldErrors } from "../../../../../../utils/apiErrorMessage";

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

type RuleUpdateInput = { rules: string };

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
    ? null
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
  component: FlagUpdatePage,
  notFoundComponent: FlagNotFound,
});

function FlagNotFound() {
  return (
    <CenteredContent>
      <EmptyState
        icon={<FlagIcon />}
        title="Flag not found"
        description="Please double check if you are in the right organization"
        withIndicatorBackground
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
  const form = useForm<RuleUpdateInput>({
    mode: "uncontrolled",
    validate: { rules: validateRules },
    validateInputOnBlur: true,
  });
  const flagEnvironmentId =
    flagEnvironments.data?.listFlagEnvironments?.results?.[0]?.id;
  const environmentRules =
    flagEnvironments.data?.listFlagEnvironments?.results?.[0]?.rules;

  useEffect(() => {
    if (environmentRules == null) {
      return;
    }

    form.setFieldValue("rules", formatRules(environmentRules));
  }, [environmentRules]);

  const handleSubmit = async (values: RuleUpdateInput) => {
    const { data } = await updateRule({
      id: flagEnvironmentId ?? "",
      input: { rules: values.rules },
    });

    if (data?.updateFlagEnvironment.result != null) {
      return;
    }

    const errors = data?.updateFlagEnvironment.errors;
    form.setErrors(getMutationFieldErrors(errors));
  };

  const isSubmitEnabled = form.isDirty() && form.isValid();

  return (
    <Container>
      <Stack mb="md">
        <Title>Update flag</Title>
        <Text c="dimmed">Name</Text>
        <Text>{flag.name}</Text>
        <Text c="dimmed">Owning project</Text>
        <LinkAnchor
          to="/project/$projectName"
          params={{ projectName: flag.project.name }}
        >
          {flag.project.name}
        </LinkAnchor>
        <Text c="dimmed">Environment</Text>
        <EnvironmentSelector
          environments={flag.project.environments}
          value={selectedEnvironment}
          onChange={setSelectedEnvironment}
          allowDeselect={false}
        />
      </Stack>

      <form onSubmit={form.onSubmit((values) => handleSubmit(values))}>
        <Stack>
          <Text c="dimmed">Environment configuration</Text>
          <JsonInput
            loading={flagEnvironments.fetching}
            placeholder="Flag rule configuration for this environment..."
            aria-label="Flag rule configuration"
            minRows={10}
            formatOnBlur
            autosize
            key={form.key("rules")}
            {...form.getInputProps("rules")}
          />
          <Group justify="flex-end">
            <Button
              type="submit"
              loading={fetching}
              disabled={!isSubmitEnabled}
            >
              Update
            </Button>
          </Group>
        </Stack>
      </form>
    </Container>
  );
}
