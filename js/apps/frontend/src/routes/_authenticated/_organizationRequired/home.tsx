import { Paper, Stack, Text, Title } from "@mantine/core";
import { createFileRoute } from "@tanstack/react-router";
import { useAtomValue } from "jotai";
import { currentUserAtom } from "../../../atoms/currentUser";
import { CenteredContent } from "../../../components/layout/CenteredContent";
import { pageTitle } from "../../../utils/pageTitle";

export const Route = createFileRoute(
  "/_authenticated/_organizationRequired/home",
)({
  head: () => ({ meta: [{ title: pageTitle("Home") }] }),
  component: HomePage,
});

function HomePage() {
  const currentUser = useAtomValue(currentUserAtom);

  return (
    <CenteredContent>
      <Paper withBorder miw={500} py="lg" px="lg">
        <Stack>
          <Title>Welcome</Title>
          <Text c="dimmed">
            You are signed in as {currentUser?.email ?? "an unknown user"}.
          </Text>
        </Stack>
      </Paper>
    </CenteredContent>
  );
}
