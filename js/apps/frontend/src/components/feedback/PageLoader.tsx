import { Center, Loader, Stack, Text } from "@mantine/core";

type PageLoaderProps = {
  label?: string;
};

export function PageLoader({ label }: PageLoaderProps) {
  return (
    <Center w="100%">
      <Stack align="center" gap="sm">
        <Loader size="lg" type="dots" />
        {label && (
          <Text size="sm" c="dimmed">
            {label}
          </Text>
        )}
      </Stack>
    </Center>
  );
}
