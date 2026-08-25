import { Container, Stack, Title } from "@mantine/core";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "urql";
import { CreateFlagForm } from "../../../../components/flags/CreateFlagForm";
import { projectSelector_projects } from "../../../../components/projects/ProjectSelector";
import { graphql } from "../../../../graphql/graphql";
import { loadQuery } from "../../../../utils/loadQuery";

export const FlagCreatePageQuery = graphql(
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
    await loadQuery(context.client, FlagCreatePageQuery, {});
  },
  component: FlagCreatePage,
});

function FlagCreatePage() {
  const [page] = useQuery({ query: FlagCreatePageQuery });
  const listProjects = page.data?.listProjects;

  return (
    <Container>
      <Stack>
        <Title>Create flag</Title>
        <CreateFlagForm
          projects={listProjects?.results ?? []}
          isDataLoading={page.fetching}
        />
      </Stack>
    </Container>
  );
}
