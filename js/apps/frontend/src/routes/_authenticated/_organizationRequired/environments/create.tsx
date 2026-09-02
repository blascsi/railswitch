import { Stack } from "@astryxdesign/core/Stack";
import { Heading } from "@astryxdesign/core/Text";
import { createFileRoute } from "@tanstack/react-router";
import { CreateEnvironmentForm } from "../../../../components/environments/CreateEnvironmentForm";
import { projectSelector_projects } from "../../../../components/projects/projectOptions";
import { graphql } from "../../../../graphql/graphql";
import { pageTitle } from "../../../../utils/pageTitle";

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
  head: () => ({ meta: [{ title: pageTitle("Create environment") }] }),
  component: EnvironmentCreatePage,
});

function EnvironmentCreatePage() {
  const loaderData = Route.useLoaderData();
  const { listProjects } = loaderData;

  return (
    <Stack gap={4}>
      <Heading level={1}>Create environment</Heading>
      <CreateEnvironmentForm projects={listProjects?.results ?? []} />
    </Stack>
  );
}
