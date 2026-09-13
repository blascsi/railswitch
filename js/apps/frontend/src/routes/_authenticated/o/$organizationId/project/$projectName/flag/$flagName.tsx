import { EmptyState } from "@astryxdesign/core/EmptyState";
import { Stack } from "@astryxdesign/core/Stack";
import { Heading, Text } from "@astryxdesign/core/Text";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { AppIcon } from "../../../../../../../components/AppIcon";
import {
  UpdateFlagForm,
  updateFlagForm_flag,
} from "../../../../../../../components/flags/UpdateFlagForm";
import { CenteredContent } from "../../../../../../../components/layout/CenteredContent";
import { LinkAnchor } from "../../../../../../../components/routing/link-components/LinkAnchor";
import { graphql } from "../../../../../../../graphql/graphql";
import { loaderQuery } from "../../../../../../../graphql/loaderQuery";
import { pageTitle } from "../../../../../../../utils/pageTitle";

const FlagUpdatePageQuery = graphql(
  `
  query FlagUpdatePageQuery($projectName: String!, $flagName: String!) {
    getFlagByName(projectName: $projectName, flagName: $flagName) {
      id
      name
      project {
        id
        name
      }
      ...updateFlagForm_flag
    }
  }
`,
  [updateFlagForm_flag],
);

export const Route = createFileRoute(
  "/_authenticated/o/$organizationId/project/$projectName/flag/$flagName",
)({
  loader: async ({ context, params }) => {
    const { getFlagByName: flag } = await loaderQuery(
      context.client,
      FlagUpdatePageQuery,
      {
        projectName: params.projectName,
        flagName: params.flagName,
      },
    );

    if (flag == null) {
      throw notFound();
    }

    return { flag };
  },
  head: ({ loaderData }) => ({
    meta: [{ title: pageTitle(loaderData?.flag.name) }],
  }),
  component: FlagUpdatePage,
  notFoundComponent: FlagNotFound,
});

function FlagNotFound() {
  return (
    <CenteredContent>
      <EmptyState
        icon={<AppIcon icon="flag" size="lg" />}
        title="Flag not found"
        description="Please double check if you are in the right organization"
      />
    </CenteredContent>
  );
}

function FlagUpdatePage() {
  const { flag } = Route.useLoaderData();

  return (
    <Stack gap={4}>
      <Stack gap={3}>
        <Heading level={1}>{flag.name}</Heading>
        <Text>
          in{" "}
          <LinkAnchor
            from="/o/$organizationId"
            to="/o/$organizationId/project/$projectName"
            params={{ projectName: flag.project.name }}
          >
            <Text type="code">{flag.project.name}</Text>
          </LinkAnchor>
        </Text>
      </Stack>

      {/* Keyed so the environment choice and unsaved rules do not follow us to
          the next flag, whose environments might be different. */}
      <UpdateFlagForm key={flag.id} flag={flag} />
    </Stack>
  );
}
