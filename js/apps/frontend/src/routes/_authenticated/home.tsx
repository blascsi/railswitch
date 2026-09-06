import { Card } from "@astryxdesign/core/Card";
import { Stack } from "@astryxdesign/core/Stack";
import { Heading, Text } from "@astryxdesign/core/Text";
import { createFileRoute } from "@tanstack/react-router";
import { useAtomValue } from "jotai";
import { currentUserAtom } from "../../atoms/currentUser";
import { CenteredContent } from "../../components/layout/CenteredContent";
import { pageTitle } from "../../utils/pageTitle";

export const Route = createFileRoute("/_authenticated/home")({
  head: () => ({ meta: [{ title: pageTitle("Home") }] }),
  component: HomePage,
});

function HomePage() {
  const currentUser = useAtomValue(currentUserAtom);

  return (
    <CenteredContent>
      <Card width="min(100%, 500px)">
        <Stack gap={4} padding={5}>
          <Heading level={1}>Welcome</Heading>
          <Text type="supporting">
            You are signed in as {currentUser?.email ?? "an unknown user"}.
          </Text>
        </Stack>
      </Card>
    </CenteredContent>
  );
}
