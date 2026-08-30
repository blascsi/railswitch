import { Container, Stack, Title } from "@mantine/core";
import { createFileRoute } from "@tanstack/react-router";
import { CreateProjectForm } from "../../../../components/projects/CreateProjectForm";
import { pageTitle } from "../../../../utils/pageTitle";

export const Route = createFileRoute(
  "/_authenticated/_organizationRequired/projects/create",
)({
  head: () => ({ meta: [{ title: pageTitle("Create project") }] }),
  component: ProjectCreatePage,
});

function ProjectCreatePage() {
  return (
    <Container>
      <Stack>
        <Title>Create project</Title>
        <CreateProjectForm />
      </Stack>
    </Container>
  );
}
