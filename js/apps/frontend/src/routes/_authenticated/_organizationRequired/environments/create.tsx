import { Container, Stack, Title } from "@mantine/core";
import { createFileRoute } from "@tanstack/react-router";
import { CreateEnvironmentForm } from "../../../../components/environments/CreateEnvironmentForm";
import { projectSelector_projects } from "../../../../components/projects/ProjectSelector";
import { graphql } from "../../../../graphql/graphql";

const EnvironmentCreatePageQuery = graphql(
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
    const { data, error } = await context.client
      .query(EnvironmentCreatePageQuery, {})
      .toPromise();

    if (data == null) {
      throw error;
    }

    return data;
  },
  component: EnvironmentCreatePage,
});

function EnvironmentCreatePage() {
  const loaderData = Route.useLoaderData();
  const { listProjects } = loaderData;

  return (
    <Container>
      <Stack>
        <Title>Create environment</Title>
        <CreateEnvironmentForm projects={listProjects?.results ?? []} />
      </Stack>
    </Container>
  );
}
