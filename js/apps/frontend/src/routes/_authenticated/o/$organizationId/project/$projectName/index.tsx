import { EmptyState } from "@astryxdesign/core/EmptyState";
import { Stack } from "@astryxdesign/core/Stack";
import { Heading, Text } from "@astryxdesign/core/Text";
import { createFileRoute, notFound } from "@tanstack/react-router";

import { AppIcon } from "../../../../../../components/AppIcon";
import { CenteredContent } from "../../../../../../components/layout/CenteredContent";
import { graphql } from "../../../../../../graphql/graphql";
import { loaderQuery } from "../../../../../../graphql/loaderQuery";
import { pageTitle } from "../../../../../../utils/pageTitle";

const ProjectPageQuery = graphql(`
  query ProjectPageQuery($name: String!) {
    getProjectByName(name: $name) {
      id
      name
    }
  }
`);

export const Route = createFileRoute(
  "/_authenticated/o/$organizationId/project/$projectName/",
)({
  loader: async ({ context, params }) => {
    const { getProjectByName: project } = await loaderQuery(
      context.client,
      ProjectPageQuery,
      { name: params.projectName },
    );

    if (project == null) {
      throw notFound();
    }

    return { project };
  },
  head: ({ loaderData }) => ({
    meta: [{ title: pageTitle(loaderData?.project.name) }],
  }),
  component: ProjectEditPage,
  notFoundComponent: ProjectNotFound,
});

function ProjectNotFound() {
  return (
    <CenteredContent>
      <EmptyState
        icon={<AppIcon icon="project" size="lg" />}
        title="Project not found"
        description="Please double check if you are in the right organization"
      />
    </CenteredContent>
  );
}

function ProjectEditPage() {
  const loaderData = Route.useLoaderData();
  const { project } = loaderData;

  return (
    <Stack gap={3}>
      <Heading level={1}>Project details</Heading>
      <Text type="supporting">Name</Text>
      <Text>{project.name}</Text>
    </Stack>
  );
}
