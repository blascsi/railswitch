import { Card } from "@astryxdesign/core/Card";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { Icon } from "@astryxdesign/core/Icon";
import { Stack } from "@astryxdesign/core/Stack";
import { Heading } from "@astryxdesign/core/Text";
import { PlusIcon, TerminalIcon } from "@phosphor-icons/react";
import { createFileRoute } from "@tanstack/react-router";
import {
  EnvironmentsTable,
  environmentsTable_environments,
} from "../../../../../components/environments/EnvironmentsTable";
import { CenteredContent } from "../../../../../components/layout/CenteredContent";
import { LinkActionButton } from "../../../../../components/routing/link-components/LinkActionButton";
import { LinkButton } from "../../../../../components/routing/link-components/LinkButton";
import { graphql } from "../../../../../graphql/graphql";
import { pageTitle } from "../../../../../utils/pageTitle";

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
  "/_authenticated/o/$organizationId/environments/",
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
          icon={<Icon icon={TerminalIcon} size="lg" />}
          title="No environments found"
          description="Please double check if you are in the right organization, or start by creating a new environment"
          actions={
            <LinkButton
              from="/o/$organizationId"
              to="/o/$organizationId/environments/create"
              label="Create"
            />
          }
        />
      </CenteredContent>
    );
  }

  return (
    <Stack gap={4}>
      <Stack direction="horizontal" hAlign="between" vAlign="center">
        <Heading level={1}>Environments</Heading>
        <LinkActionButton
          from="/o/$organizationId"
          to="/o/$organizationId/environments/create"
          label="Create new environment"
          icon={<PlusIcon />}
        />
      </Stack>
      <Card>
        <EnvironmentsTable environments={listEnvironments?.results ?? []} />
      </Card>
    </Stack>
  );
}
