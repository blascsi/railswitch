import { Card } from "@astryxdesign/core/Card";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { Icon } from "@astryxdesign/core/Icon";
import { Stack } from "@astryxdesign/core/Stack";
import { Heading } from "@astryxdesign/core/Text";
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
          icon={<Icon icon={FlagIcon} size="lg" />}
          title="No flags found"
          description="Please double check if you are in the right organization, or start by creating a flag"
          actions={<LinkButton to="/flags/create" label="Create" />}
        />
      </CenteredContent>
    );
  }

  return (
    <Stack gap={4}>
      <Stack direction="horizontal" hAlign="between" vAlign="center">
        <Heading level={1}>Flags</Heading>
        <LinkActionButton
          to="/flags/create"
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
