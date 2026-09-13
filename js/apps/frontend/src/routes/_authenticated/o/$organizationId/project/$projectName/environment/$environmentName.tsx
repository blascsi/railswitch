import { EmptyState } from "@astryxdesign/core/EmptyState";
import { Stack } from "@astryxdesign/core/Stack";
import { Heading, Text } from "@astryxdesign/core/Text";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { AppIcon } from "../../../../../../../components/AppIcon";
import { CenteredContent } from "../../../../../../../components/layout/CenteredContent";
import { LinkAnchor } from "../../../../../../../components/routing/link-components/LinkAnchor";
import { graphql } from "../../../../../../../graphql/graphql";
import { loaderQuery } from "../../../../../../../graphql/loaderQuery";
import { pageTitle } from "../../../../../../../utils/pageTitle";

const EnvironmentPageQuery = graphql(`
  query EnvironmentPageQuery($projectName: String!, $environmentName: String!) {
    getEnvironmentByName(projectName: $projectName, environmentName: $environmentName) {
      name
      project {
        id
        name
      }
    }
  }
`);

export const Route = createFileRoute(
  "/_authenticated/o/$organizationId/project/$projectName/environment/$environmentName",
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
        icon={<AppIcon icon="environment" size="lg" />}
        title="Environment not found"
        description="Please double check if you are in the right organization"
      />
    </CenteredContent>
  );
}

function EnvironmentPage() {
  const loaderData = Route.useLoaderData();
  const { environment } = loaderData;

  return (
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
  );
}
