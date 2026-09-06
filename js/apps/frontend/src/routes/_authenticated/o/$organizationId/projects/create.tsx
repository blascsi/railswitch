import { Stack } from "@astryxdesign/core/Stack";
import { Heading } from "@astryxdesign/core/Text";
import { createFileRoute } from "@tanstack/react-router";
import { CreateProjectForm } from "../../../../../components/projects/CreateProjectForm";
import { pageTitle } from "../../../../../utils/pageTitle";

export const Route = createFileRoute(
  "/_authenticated/o/$organizationId/projects/create",
)({
  head: () => ({ meta: [{ title: pageTitle("Create project") }] }),
  component: ProjectCreatePage,
});

function ProjectCreatePage() {
  return (
    <Stack gap={4}>
      <Heading level={1}>Create project</Heading>
      <CreateProjectForm />
    </Stack>
  );
}
