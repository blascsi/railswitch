import { Button } from "@astryxdesign/core/Button";
import { Center } from "@astryxdesign/core/Center";
import { Stack } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";
import { useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import {
  ErrorBoundary,
  type FallbackProps,
  getErrorMessage,
} from "react-error-boundary";
import { AppIcon } from "../AppIcon";

function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  const message = getErrorMessage(error) ?? "An unexpected error occurred.";
  const isChunkError =
    /Failed to fetch dynamically imported module|Loading chunk/i.test(message);

  return (
    <Center width="100%" height="100%" padding={4}>
      <Stack gap={2} hAlign="center" width="min(100%, 420px)">
        <AppIcon icon="warning" size="lg" color="error" />
        <Text weight="semibold">Something went wrong loading this page.</Text>
        <Text type="supporting">{message}</Text>
        <Button
          label={isChunkError ? "Reload" : "Try again"}
          onClick={() =>
            isChunkError ? window.location.reload() : resetErrorBoundary()
          }
        />
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
