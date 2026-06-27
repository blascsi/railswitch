import {
  Center,
  Loader,
  type MantineStyleProps,
  Stack,
  Text,
} from "@mantine/core";

type PageLoaderProps = {
  label?: string;
  height?: MantineStyleProps["h"];
};

export function PageLoader({ label, height = "100vh" }: PageLoaderProps) {
  return (
    <Center h={height} w="100%">
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
