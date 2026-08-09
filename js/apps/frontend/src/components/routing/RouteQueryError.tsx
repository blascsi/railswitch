import { Container } from "@mantine/core";
import type { ErrorComponentProps } from "@tanstack/react-router";
import { CombinedError } from "urql";
import { QueryError } from "../feedback/QueryError";

export function RouteQueryError({ error, reset }: ErrorComponentProps) {
  const combinedError =
    error instanceof CombinedError
      ? error
      : new CombinedError({ networkError: error });

  return (
    <Container>
      <QueryError
        title="Failed to load this page"
        error={combinedError}
        onRetry={reset}
      />
    </Container>
  );
}
