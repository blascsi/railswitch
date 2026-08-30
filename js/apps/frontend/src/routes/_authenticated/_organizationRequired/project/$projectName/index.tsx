import { Container, EmptyState, Stack, Text, Title } from "@mantine/core";
import { FolderIcon } from "@phosphor-icons/react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "urql";
import { FullPageLoader } from "../../../../../components/feedback/FullPageLoader";
import { CenteredContent } from "../../../../../components/layout/CenteredContent";
import { graphql } from "../../../../../graphql/graphql";
import { loadQuery } from "../../../../../utils/loadQuery";

export const ProjectPageQuery = graphql(
  `
  query ProjectPageQuery($name: String!) {
    getProjectByName(name: $name) {
      id
      name
    }
  }
`,
);

export const Route = createFileRoute(
  "/_authenticated/_organizationRequired/project/$projectName/",
)({
  loader: async ({ context, params }) => {
    await loadQuery(context.client, ProjectPageQuery, {
      name: params.projectName,
    });
  },
  component: ProjectEditPage,
});

function ProjectEditPage() {
  const { projectName } = Route.useParams();
  const [page] = useQuery({
    query: ProjectPageQuery,
    variables: { name: projectName },
  });

  if (page.fetching && page.data == null) {
    return <FullPageLoader />;
  }

  if (page.data?.getProjectByName == null) {
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

  const project = page.data.getProjectByName;

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
