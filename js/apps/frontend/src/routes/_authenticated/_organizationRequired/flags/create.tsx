import { Stack } from "@astryxdesign/core/Stack";
import { Heading } from "@astryxdesign/core/Text";
import { createFileRoute } from "@tanstack/react-router";
import { CreateFlagForm } from "../../../../components/flags/CreateFlagForm";
import { projectSelector_projects } from "../../../../components/projects/projectOptions";
import { graphql } from "../../../../graphql/graphql";
import { pageTitle } from "../../../../utils/pageTitle";

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
  head: () => ({ meta: [{ title: pageTitle("Create flag") }] }),
  component: FlagCreatePage,
});

function FlagCreatePage() {
  const loaderData = Route.useLoaderData();
  const { listProjects } = loaderData;

  return (
    <Stack gap={4}>
      <Heading level={1}>Create flag</Heading>
      <CreateFlagForm projects={listProjects?.results ?? []} />
    </Stack>
  );
}
