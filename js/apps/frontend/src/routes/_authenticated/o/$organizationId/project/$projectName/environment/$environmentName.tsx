import { EmptyState } from "@astryxdesign/core/EmptyState";
import { Icon } from "@astryxdesign/core/Icon";
import { Stack } from "@astryxdesign/core/Stack";
import { Heading, Text } from "@astryxdesign/core/Text";
import { TerminalIcon } from "@phosphor-icons/react";
import { createFileRoute, notFound } from "@tanstack/react-router";
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
        icon={<Icon icon={TerminalIcon} size="lg" />}
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
      <Heading level={1}>Environment details</Heading>
      <Text type="supporting">Name</Text>
      <Text>{environment.name}</Text>
      <Text type="supporting">Owning project</Text>
      <LinkAnchor
        from="/o/$organizationId"
        to="/o/$organizationId/project/$projectName"
        params={{ projectName: environment.project.name }}
      >
        {environment.project.name}
      </LinkAnchor>
    </Stack>
  );
}
