import { EmptyState } from "@astryxdesign/core/EmptyState";
import { HStack, Stack } from "@astryxdesign/core/Stack";
import { Heading, Text } from "@astryxdesign/core/Text";
import { createFileRoute, notFound, useRouter } from "@tanstack/react-router";
import { useMutation } from "urql";

import { AppIcon } from "../../../../../../../../components/AppIcon";
import {
  EnvironmentApiKeysTable,
  environmentApiKeysTable_apiKeys,
} from "../../../../../../../../components/environment-api-keys/EnvironmentApiKeysTable";
import { CenteredContent } from "../../../../../../../../components/layout/CenteredContent";
import { LinkAnchor } from "../../../../../../../../components/routing/link-components/LinkAnchor";
import { LinkButton } from "../../../../../../../../components/routing/link-components/LinkButton";
import { graphql } from "../../../../../../../../graphql/graphql";
import { loaderQuery } from "../../../../../../../../graphql/loaderQuery";
import { pageTitle } from "../../../../../../../../utils/pageTitle";

const EnvironmentPageQuery = graphql(
  `
    query EnvironmentPageQuery(
      $projectName: String!
      $environmentName: String!
    ) {
      getEnvironmentByName(
        projectName: $projectName
        environmentName: $environmentName
      ) {
        name
        project {
          id
          name
        }
        validApiKeys {
          ...environmentApiKeysTable_apiKeys
        }
      }
    }
  `,
  [environmentApiKeysTable_apiKeys],
);

const DeleteEnvironmentApiKeyMutation = graphql(`
  mutation DeleteEnvironmentApiKey($id: ID!) {
    deleteEnvironmentApiKey(id: $id) {
      result {
        id
      }
      errors {
        message
        fields
      }
    }
  }
`);

export const Route = createFileRoute(
  "/_authenticated/o/$organizationId/project/$projectName/environment/$environmentName/",
)({
  loader: async ({ context, params }) => {
    const { getEnvironmentByName: environment } = await loaderQuery(
      context.client,
      EnvironmentPageQuery,
      {
        projectName: params.projectName,
        environmentName: params.environmentName,
      },
    );

    if (environment == null) {
      throw notFound();
    }

    return { environment };
  },
  head: ({ loaderData }) => ({
    meta: [{ title: pageTitle(loaderData?.environment.name) }],
  }),
  component: EnvironmentPage,
  notFoundComponent: EnvironmentNotFound,
});

function EnvironmentNotFound() {
  return (
    <CenteredContent>
      <EmptyState
        icon={<AppIcon icon="terminal" size="lg" />}
        title="Environment not found"
        description="Please double check if you are in the right organization"
      />
    </CenteredContent>
  );
}

function EnvironmentPage() {
  const router = useRouter();
  const [{ fetching: isDeletingApiKey }, deleteEnvironmentApiKey] = useMutation(
    DeleteEnvironmentApiKeyMutation,
  );
  const routeParams = Route.useParams();
  const loaderData = Route.useLoaderData();
  const { environment } = loaderData;

  const handleDeleteApiKey = async (apiKeyId: string) => {
    await deleteEnvironmentApiKey({ id: apiKeyId });
    await router.invalidate({
      filter: (match) => match.routeId === Route.id,
    });
  };

  return (
    <Stack gap={4}>
      <Stack gap={3}>
        <Heading level={1}>{environment.name}</Heading>
        <Text>
          in{" "}
          <LinkAnchor
            from="/o/$organizationId"
            to="/o/$organizationId/project/$projectName"
            params={{ projectName: environment.project.name }}
          >
            <Text type="code">{environment.project.name}</Text>
          </LinkAnchor>
        </Text>
      </Stack>
      <HStack justify="between">
        <Heading level={2}>API keys</Heading>
        <LinkButton
          label="Create API key"
          icon={<AppIcon icon="plus" />}
          variant="primary"
          to="/o/$organizationId/project/$projectName/environment/$environmentName/create_api_key"
          params={routeParams}
        />
      </HStack>
      <EnvironmentApiKeysTable
        apiKeys={environment.validApiKeys}
        isDeleting={isDeletingApiKey}
        onDelete={handleDeleteApiKey}
      />
    </Stack>
  );
}
