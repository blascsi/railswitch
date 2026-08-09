import { Alert, Button, Stack, Text } from "@mantine/core";
import type { CombinedError } from "urql";
import { getApiErrorMessage } from "../../utils/apiErrorMessage";

type QueryErrorProps = {
  title: string;
  error: CombinedError;
  onRetry: () => void;
};

export function QueryError({ title, error, onRetry }: QueryErrorProps) {
  return (
    <Alert color="red" title={title}>
      <Stack align="flex-start" gap="sm">
        <Text size="sm">{getApiErrorMessage(error)}</Text>
        <Button variant="light" color="red" size="xs" onClick={onRetry}>
          Retry
        </Button>
      </Stack>
    </Alert>
  );
}
