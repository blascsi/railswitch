import { Button, Center, Stack, Text, ThemeIcon } from "@mantine/core";
import { WarningIcon } from "@phosphor-icons/react";
import { useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import {
  ErrorBoundary,
  type FallbackProps,
  getErrorMessage,
} from "react-error-boundary";

function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  const message = getErrorMessage(error) ?? "An unexpected error occurred.";
  const isChunkError =
    /Failed to fetch dynamically imported module|Loading chunk/i.test(message);

  return (
    <Center h="100%" w="100%" p="md">
      <Stack align="center" gap="sm" maw={420}>
        <ThemeIcon size="xl" radius="xl" color="red" variant="light">
          <WarningIcon />
        </ThemeIcon>
        <Text fw={600}>Something went wrong loading this page.</Text>
        <Text size="sm" c="dimmed" ta="center">
          {message}
        </Text>
        <Button
          onClick={() =>
            isChunkError ? window.location.reload() : resetErrorBoundary()
          }
        >
          {isChunkError ? "Reload" : "Try again"}
        </Button>
      </Stack>
    </Center>
  );
}

export function PageErrorBoundary({ children }: { children: ReactNode }) {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback} resetKeys={[pathname]}>
      {children}
    </ErrorBoundary>
  );
}
