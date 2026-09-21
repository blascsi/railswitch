import { Banner } from "@astryxdesign/core/Banner";
import { Button } from "@astryxdesign/core/Button";

import { getApiErrorMessage } from "../../utils/apiErrorMessage";

type QueryErrorProps = {
  title: string;
  error: unknown;
  onRetry: () => void;
};

export function QueryError({ title, error, onRetry }: QueryErrorProps) {
  return (
    <Banner
      status="error"
      title={title}
      description={getApiErrorMessage(error)}
      endContent={<Button label="Retry" size="sm" onClick={onRetry} />}
    />
  );
}
