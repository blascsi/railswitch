import { Container, EmptyState, Stack, Text, Title } from "@mantine/core";
import { FolderIcon } from "@phosphor-icons/react";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { CenteredContent } from "../../../../../components/layout/CenteredContent";
import { graphql } from "../../../../../graphql/graphql";
import { pageTitle } from "../../../../../utils/pageTitle";

const ProjectPageQuery = graphql(`
  query ProjectPageQuery($name: String!) {
    getProjectByName(name: $name) {
      id
      name
    }
  }
`);

export const Route = createFileRoute(
  "/_authenticated/_organizationRequired/project/$projectName/",
)({
  loader: async ({ context, params }) => {
    const { data, error } = await context.client
      .query(ProjectPageQuery, { name: params.projectName })
      .toPromise();

    if (data == null) {
      throw error;
    }

    const project = data.getProjectByName;

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
        icon={<FolderIcon />}
        title="Project not found"
        description="Please double check if you are in the right organization"
        withIndicatorBackground
      />
    </CenteredContent>
  );
}

function ProjectEditPage() {
  const loaderData = Route.useLoaderData();
  const { project } = loaderData;

  return (
    <Container>
      <Stack>
        <Title>Project details</Title>
        <Text c="dimmed">Name</Text>
        <Text>{project.name}</Text>
      </Stack>
    </Container>
  );
}
