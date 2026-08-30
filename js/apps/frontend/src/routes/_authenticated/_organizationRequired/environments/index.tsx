import { Container, EmptyState, Group, Stack, Title } from "@mantine/core";
import { PlusIcon, TerminalIcon } from "@phosphor-icons/react";
import { createFileRoute } from "@tanstack/react-router";
import {
  EnvironmentsTable,
  environmentsTable_environments,
} from "../../../../components/environments/EnvironmentsTable";
import { CenteredContent } from "../../../../components/layout/CenteredContent";
import { LinkActionButton } from "../../../../components/routing/link-components/LinkActionButton";
import { LinkButton } from "../../../../components/routing/link-components/LinkButton";
import { graphql } from "../../../../graphql/graphql";
import { pageTitle } from "../../../../utils/pageTitle";

const EnvironmentsPageQuery = graphql(
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
    const { data, error } = await context.client
      .query(EnvironmentsPageQuery, {})
      .toPromise();

    if (data == null) {
      throw error;
    }

    return data;
  },
  head: () => ({ meta: [{ title: pageTitle("Environments") }] }),
  component: EnvironmentsPage,
});

function EnvironmentsPage() {
  const loaderData = Route.useLoaderData();
  const { listEnvironments } = loaderData;

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
