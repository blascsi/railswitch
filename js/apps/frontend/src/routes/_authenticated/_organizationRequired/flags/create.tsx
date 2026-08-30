import { Container, Stack, Title } from "@mantine/core";
import { createFileRoute } from "@tanstack/react-router";
import { CreateFlagForm } from "../../../../components/flags/CreateFlagForm";
import { projectSelector_projects } from "../../../../components/projects/ProjectSelector";
import { graphql } from "../../../../graphql/graphql";

const FlagCreatePageQuery = graphql(
  `
  query FlagCreatePage {
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
  "/_authenticated/_organizationRequired/flags/create",
)({
  loader: async ({ context }) => {
    const { data, error } = await context.client
      .query(FlagCreatePageQuery, {})
      .toPromise();

    if (data == null) {
      throw error;
    }

    return data;
  },
  component: FlagCreatePage,
});

function FlagCreatePage() {
  const loaderData = Route.useLoaderData();
  const { listProjects } = loaderData;

  return (
    <Container>
      <Stack>
        <Title>Create flag</Title>
        <CreateFlagForm projects={listProjects?.results ?? []} />
      </Stack>
    </Container>
  );
}
