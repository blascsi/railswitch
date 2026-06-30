import { Center, Paper, Stack, Text, Title } from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import { PageLoader } from "../components/PageLoader";
import { getUsersMeOptions } from "../generated/client/@tanstack/react-query.gen";

function HomePage() {
  const { data, isPending } = useQuery(getUsersMeOptions());

  if (isPending) {
    return <PageLoader label="Loading your account…" />;
  }

  return (
    <Center mih="100vh">
      <Paper withBorder miw={500} py="lg" px="lg">
        <Stack>
          <Title>Welcome</Title>
          <Text c="dimmed">
            You are signed in as{" "}
            {data?.data?.attributes?.email ?? "an unknown user"}.
          </Text>
        </Stack>
      </Paper>
    </Center>
  );
}

export default HomePage;
