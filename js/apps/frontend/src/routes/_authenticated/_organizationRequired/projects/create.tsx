import { Container, Stack, Title } from "@mantine/core";
import { createFileRoute } from "@tanstack/react-router";
import { CreateProjectForm } from "../../../../components/projects/CreateProjectForm";

export const Route = createFileRoute(
  "/_authenticated/_organizationRequired/projects/create",
)({
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
