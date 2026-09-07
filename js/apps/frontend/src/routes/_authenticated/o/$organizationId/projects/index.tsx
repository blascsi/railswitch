import { Card } from "@astryxdesign/core/Card";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { Icon } from "@astryxdesign/core/Icon";
import { Stack } from "@astryxdesign/core/Stack";
import { Heading } from "@astryxdesign/core/Text";
import { FolderIcon, PlusIcon } from "@phosphor-icons/react";
import { createFileRoute } from "@tanstack/react-router";
import { CenteredContent } from "../../../../../components/layout/CenteredContent";
import {
  ProjectsTable,
  projectsTable_projects,
} from "../../../../../components/projects/ProjectsTable";
import { LinkActionButton } from "../../../../../components/routing/link-components/LinkActionButton";
import { LinkButton } from "../../../../../components/routing/link-components/LinkButton";
import { graphql } from "../../../../../graphql/graphql";
import { loaderQuery } from "../../../../../graphql/loaderQuery";
import { pageTitle } from "../../../../../utils/pageTitle";

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
  "/_authenticated/o/$organizationId/projects/",
)({
  loader: ({ context }) => loaderQuery(context.client, ProjectsPageQuery, {}),
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
          icon={<Icon icon={FolderIcon} size="lg" />}
          title="No projects found"
          description="Please double check if you are in the right organization, or start by creating some projects."
          actions={
            <LinkButton
              from="/o/$organizationId"
              to="/o/$organizationId/projects/create"
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
        <Heading level={1}>Projects</Heading>
        <LinkActionButton
          from="/o/$organizationId"
          to="/o/$organizationId/projects/create"
          label="Create new project"
          icon={<PlusIcon />}
        />
      </Stack>
      <Card>
        <ProjectsTable projects={listProjects?.results ?? []} />
      </Card>
    </Stack>
  );
}
