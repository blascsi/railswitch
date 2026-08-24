import { Container, EmptyState, Stack, Text, Title } from "@mantine/core";
import { TerminalIcon } from "@phosphor-icons/react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "urql";
import { FullPageLoader } from "../../../../components/feedback/FullPageLoader";
import { CenteredContent } from "../../../../components/layout/CenteredContent";
import { LinkAnchor } from "../../../../components/routing/link-components/LinkAnchor";
import { graphql } from "../../../../graphql/graphql";
import { loadQuery } from "../../../../utils/loadQuery";

export const EnvironmentPageQuery = graphql(`
  query EnvironmentPageQuery($id: ID!) {
    getEnvironment(id: $id) {
      name
      project {
        id
        name
      }
    }
  }
`);

export const Route = createFileRoute(
  "/_authenticated/_organizationRequired/environments/$id",
)({
  loader: async ({ context, params }) => {
    await loadQuery(context.client, EnvironmentPageQuery, { id: params.id });
  },
  component: EnvironmentPage,
});

function EnvironmentPage() {
  const { id } = Route.useParams();
  const [page] = useQuery({ query: EnvironmentPageQuery, variables: { id } });

  if (page.fetching && page.data == null) {
    return <FullPageLoader />;
  }

  if (page.data?.getEnvironment == null) {
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

  const environment = page.data.getEnvironment;

  return (
    <Container>
      <Stack>
        <Title>Environment details</Title>
        <Text c="dimmed">Name</Text>
        <Text>{environment.name}</Text>
        <Text c="dimmed">Owning project</Text>
        <LinkAnchor to="/projects/$id" params={{ id: environment.project.id }}>
          {environment.project.name}
        </LinkAnchor>
      </Stack>
    </Container>
  );
}
