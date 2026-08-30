import { Container, EmptyState, Stack, Text, Title } from "@mantine/core";
import { TerminalIcon } from "@phosphor-icons/react";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { CenteredContent } from "../../../../../../components/layout/CenteredContent";
import { LinkAnchor } from "../../../../../../components/routing/link-components/LinkAnchor";
import { graphql } from "../../../../../../graphql/graphql";

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
  "/_authenticated/_organizationRequired/project/$projectName/environment/$environmentName",
)({
  loader: async ({ context, params }) => {
    const { data, error } = await context.client
      .query(EnvironmentPageQuery, {
        projectName: params.projectName,
        environmentName: params.environmentName,
      })
      .toPromise();

    if (data == null) {
      throw error;
    }

    const environment = data.getEnvironmentByName;

    if (environment == null) {
      throw notFound();
    }

    return { environment };
  },
  component: EnvironmentPage,
  notFoundComponent: EnvironmentNotFound,
});

function EnvironmentNotFound() {
  return (
    <CenteredContent>
      <EmptyState
        icon={<TerminalIcon />}
        title="Environment not found"
        description="Please double check if you are in the right organization"
        withIndicatorBackground
      />
    </CenteredContent>
  );
}

function EnvironmentPage() {
  const loaderData = Route.useLoaderData();
  const { environment } = loaderData;

  return (
    <Container>
      <Stack>
        <Title>Environment details</Title>
        <Text c="dimmed">Name</Text>
        <Text>{environment.name}</Text>
        <Text c="dimmed">Owning project</Text>
        <LinkAnchor
          to="/project/$projectName"
          params={{ projectName: environment.project.name }}
        >
          {environment.project.name}
        </LinkAnchor>
      </Stack>
    </Container>
  );
}
