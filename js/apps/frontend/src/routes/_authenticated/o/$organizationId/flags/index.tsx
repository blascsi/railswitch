import { Card } from "@astryxdesign/core/Card";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { Icon } from "@astryxdesign/core/Icon";
import { Stack } from "@astryxdesign/core/Stack";
import { Heading } from "@astryxdesign/core/Text";
import { FlagIcon, PlusIcon } from "@phosphor-icons/react";
import { createFileRoute } from "@tanstack/react-router";
import {
  FlagsTable,
  flagsTable_flags,
} from "../../../../../components/flags/FlagsTable";
import { CenteredContent } from "../../../../../components/layout/CenteredContent";
import { LinkActionButton } from "../../../../../components/routing/link-components/LinkActionButton";
import { LinkButton } from "../../../../../components/routing/link-components/LinkButton";
import { graphql } from "../../../../../graphql/graphql";
import { loaderQuery } from "../../../../../graphql/loaderQuery";
import { pageTitle } from "../../../../../utils/pageTitle";

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
  "/_authenticated/o/$organizationId/flags/",
)({
  loader: ({ context }) => loaderQuery(context.client, FlagsPageQuery, {}),
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
          icon={<Icon icon={FlagIcon} size="lg" />}
          title="No flags found"
          description="Please double check if you are in the right organization, or start by creating a flag"
          actions={
            <LinkButton
              from="/o/$organizationId"
              to="/o/$organizationId/flags/create"
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
        <Heading level={1}>Flags</Heading>
        <LinkActionButton
          from="/o/$organizationId"
          to="/o/$organizationId/flags/create"
          label="Create new flag"
          icon={<PlusIcon />}
        />
      </Stack>
      <Card>
        <FlagsTable flags={listFlags?.results ?? []} />
      </Card>
    </Stack>
  );
}
