import { Stack } from "@astryxdesign/core/Stack";
import { Heading } from "@astryxdesign/core/Text";
import { createFileRoute } from "@tanstack/react-router";

import { CreateFlagForm } from "../../../../../components/flags/CreateFlagForm";
import { projectSelector_projects } from "../../../../../components/projects/projectOptions";
import { graphql } from "../../../../../graphql/graphql";
import { loaderQuery } from "../../../../../graphql/loaderQuery";
import { pageTitle } from "../../../../../utils/pageTitle";

const FlagCreatePageQuery = graphql(
  `
    query FlagCreatePage {
      listProjects(sort: [{ field: NAME, order: ASC }]) {
        results {
          ...projectSelector_projects
        }
      }
    }
  `,
  [projectSelector_projects],
);

export const Route = createFileRoute(
  "/_authenticated/o/$organizationId/flags/create",
)({
  loader: ({ context }) => loaderQuery(context.client, FlagCreatePageQuery, {}),
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
