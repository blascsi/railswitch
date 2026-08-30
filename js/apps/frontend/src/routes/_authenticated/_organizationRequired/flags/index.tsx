import { Container, EmptyState, Group, Stack, Title } from "@mantine/core";
import { PlusIcon } from "@phosphor-icons/react";
import { FlagIcon } from "@phosphor-icons/react/dist/ssr";
import { createFileRoute } from "@tanstack/react-router";
import {
  FlagsTable,
  flagsTable_flags,
} from "../../../../components/flags/FlagsTable";
import { CenteredContent } from "../../../../components/layout/CenteredContent";
import { LinkActionButton } from "../../../../components/routing/link-components/LinkActionButton";
import { LinkButton } from "../../../../components/routing/link-components/LinkButton";
import { graphql } from "../../../../graphql/graphql";
import { pageTitle } from "../../../../utils/pageTitle";

const FlagsPageQuery = graphql(
  `
  query FlagsPage {
    listFlags(sort: [{field: NAME, order: ASC}]) {
      count
      results {
        ...flagsTable_flags
      }
    }
  }
`,
  [flagsTable_flags],
);

export const Route = createFileRoute(
  "/_authenticated/_organizationRequired/flags/",
)({
  loader: async ({ context }) => {
    const { data, error } = await context.client
      .query(FlagsPageQuery, {})
      .toPromise();

    if (data == null) {
      throw error;
    }

    return data;
  },
  head: () => ({ meta: [{ title: pageTitle("Flags") }] }),
  component: FlagsPage,
});

function FlagsPage() {
  const loaderData = Route.useLoaderData();
  const { listFlags } = loaderData;

  if (listFlags?.count === 0) {
    return (
      <CenteredContent>
        <EmptyState
          icon={<FlagIcon />}
          title="No flags found"
          description="Please double check if you are in the right organization, or start by creating a flag"
          withIndicatorBackground
        >
          <EmptyState.Actions>
            <LinkButton to="/flags/create">Create</LinkButton>
          </EmptyState.Actions>
        </EmptyState>
      </CenteredContent>
    );
  }

  return (
    <Container>
      <Stack>
        <Group justify="space-between">
          <Title>Flags</Title>
          <LinkActionButton to="/flags/create" aria-label="Create new flag">
            <PlusIcon />
          </LinkActionButton>
        </Group>
        <FlagsTable flags={listFlags?.results ?? []} />
      </Stack>
    </Container>
  );
}
