import { Container, EmptyState, Group, Stack, Title } from "@mantine/core";
import { PlusIcon, TerminalIcon } from "@phosphor-icons/react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "urql";
import {
  EnvironmentsTable,
  environmentsTable_environments,
} from "../../../../components/environments/EnvironmentsTable";
import { FullPageLoader } from "../../../../components/feedback/FullPageLoader";
import { CenteredContent } from "../../../../components/layout/CenteredContent";
import { LinkActionButton } from "../../../../components/routing/link-components/LinkActionButton";
import { LinkButton } from "../../../../components/routing/link-components/LinkButton";
import { graphql } from "../../../../graphql/graphql";
import { loadQuery } from "../../../../utils/loadQuery";

export const EnvironmentsPageQuery = graphql(
  `
  query EnvironmentsPage {
    listEnvironments(sort: [{field: NAME, order: ASC}]) {
      count
      results {
        ...environmentsTable_environments
      }
    }
  }
`,
  [environmentsTable_environments],
);

export const Route = createFileRoute(
  "/_authenticated/_organizationRequired/environments/",
)({
  loader: async ({ context }) => {
    await loadQuery(context.client, EnvironmentsPageQuery, {});
  },
  component: EnvironmentsPage,
});

function EnvironmentsPage() {
  const [page] = useQuery({ query: EnvironmentsPageQuery });
  const listEnvironments = page.data?.listEnvironments;
  if (page.error && listEnvironments == null) {
    throw page.error;
  }

  if (page.fetching && page.data == null) {
    return <FullPageLoader />;
  }

  if (listEnvironments?.count === 0) {
    return (
      <CenteredContent>
        <EmptyState
          icon={<TerminalIcon />}
          title="No environments found"
          description="Please double check if you are in the right organization, or start by creating a new environment"
          withIndicatorBackground
        >
          <EmptyState.Actions>
            <LinkButton to="/environments/create">Create</LinkButton>
          </EmptyState.Actions>
        </EmptyState>
      </CenteredContent>
    );
  }

  return (
    <Container>
      <Stack>
        <Group justify="space-between">
          <Title>Environments</Title>
          <LinkActionButton
            to="/environments/create"
            aria-label="Create new environment"
          >
            <PlusIcon />
          </LinkActionButton>
        </Group>
        <EnvironmentsTable environments={listEnvironments?.results ?? []} />
      </Stack>
    </Container>
  );
}
