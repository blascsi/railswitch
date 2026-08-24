import { Container, EmptyState, Stack, Title } from "@mantine/core";
import { FolderIcon } from "@phosphor-icons/react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "urql";
import { FullPageLoader } from "../../../../components/feedback/FullPageLoader";
import { CenteredContent } from "../../../../components/layout/CenteredContent";
import {
  UpdateProjectForm,
  updateProjectForm_project,
} from "../../../../components/projects/UpdateProjectForm";
import { graphql } from "../../../../graphql/graphql";
import { loadQuery } from "../../../../utils/loadQuery";

export const ProjectEditPageQuery = graphql(
  `
  query ProjectEditPageQuery($id: ID!) {
    getProject(id: $id) {
      ...updateProjectForm_project
    }
  }
`,
  [updateProjectForm_project],
);

export const Route = createFileRoute(
  "/_authenticated/_organizationRequired/projects/$id",
)({
  loader: async ({ context, params }) => {
    await loadQuery(context.client, ProjectEditPageQuery, { id: params.id });
  },
  component: ProjectEditPage,
});

function ProjectEditPage() {
  const { id } = Route.useParams();
  const [page] = useQuery({ query: ProjectEditPageQuery, variables: { id } });

  if (page.fetching && page.data == null) {
    return <FullPageLoader />;
  }

  if (page.data?.getProject == null) {
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

  return (
    <Container>
      <Stack>
        <Title>Update project</Title>
        <UpdateProjectForm project={page.data?.getProject} />
      </Stack>
    </Container>
  );
}
