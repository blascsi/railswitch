import { Container, Stack, Title } from "@mantine/core";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "urql";
import { CreateEnvironmentForm } from "../../../../components/environments/CreateEnvironmentForm";
import { projectSelector_projects } from "../../../../components/projects/ProjectSelector";
import { graphql } from "../../../../graphql/graphql";
import { loadQuery } from "../../../../utils/loadQuery";

export const EnvironmentCreatePageQuery = graphql(
  `
  query EnvironmentCreatePage {
    listProjects(sort: [{field: NAME, order: ASC}]) {
      results {
        ...projectSelector_projects
      }
    }
  }
`,
  [projectSelector_projects],
);

export const Route = createFileRoute(
  "/_authenticated/_organizationRequired/environments/create",
)({
  loader: async ({ context }) => {
    await loadQuery(context.client, EnvironmentCreatePageQuery, {});
  },
  component: EnvironmentCreatePage,
});

function EnvironmentCreatePage() {
  const [page] = useQuery({ query: EnvironmentCreatePageQuery });
  const listProjects = page.data?.listProjects;

  return (
    <Container>
      <Stack>
        <Title>Create environment</Title>
        <CreateEnvironmentForm
          projects={listProjects?.results ?? []}
          isDataLoading={page.fetching}
        />
      </Stack>
    </Container>
  );
}
