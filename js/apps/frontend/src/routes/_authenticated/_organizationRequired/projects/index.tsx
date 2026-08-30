import { Container, EmptyState, Group, Stack, Title } from "@mantine/core";
import { FolderIcon } from "@phosphor-icons/react";
import { PlusIcon } from "@phosphor-icons/react/dist/ssr";
import { createFileRoute } from "@tanstack/react-router";
import { CenteredContent } from "../../../../components/layout/CenteredContent";
import {
  ProjectsTable,
  projectsTable_projects,
} from "../../../../components/projects/ProjectsTable";
import { LinkActionButton } from "../../../../components/routing/link-components/LinkActionButton";
import { LinkButton } from "../../../../components/routing/link-components/LinkButton";
import { graphql } from "../../../../graphql/graphql";
import { pageTitle } from "../../../../utils/pageTitle";

const ProjectsPageQuery = graphql(
  `
  query ProjectsPage {
    listProjects(sort: [{ field: NAME, order: ASC }]) {
      count
      results {
        ...projectsTable_projects
      }
    }
  }
`,
  [projectsTable_projects],
);

export const Route = createFileRoute(
  "/_authenticated/_organizationRequired/projects/",
)({
  loader: async ({ context }) => {
    const { data, error } = await context.client
      .query(ProjectsPageQuery, {})
      .toPromise();

    if (data == null) {
      throw error;
    }

    return data;
  },
  head: () => ({ meta: [{ title: pageTitle("Projects") }] }),
  component: ProjectsPage,
});

function ProjectsPage() {
  const loaderData = Route.useLoaderData();
  const { listProjects } = loaderData;

  if (listProjects?.count === 0) {
    return (
      <CenteredContent>
        <EmptyState
          icon={<FolderIcon />}
          title="No projects found"
          description="Please double check if you are in the right organization, or start by creating some projects."
          withIndicatorBackground
        >
          <EmptyState.Actions>
            <LinkButton to="/projects/create">Create</LinkButton>
          </EmptyState.Actions>
        </EmptyState>
      </CenteredContent>
    );
  }

  return (
    <Container>
      <Stack>
        <Group justify="space-between">
          <Title>Projects</Title>
          <LinkActionButton
            to="/projects/create"
            aria-label="Create new project"
          >
            <PlusIcon />
          </LinkActionButton>
        </Group>
        <ProjectsTable projects={listProjects?.results ?? []} />
      </Stack>
    </Container>
  );
}
