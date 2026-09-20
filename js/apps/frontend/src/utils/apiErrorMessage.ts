import type { CombinedError } from "urql";

const FALLBACK_MESSAGE = "Something went wrong. Please try again.";
const NETWORK_MESSAGE = "Could not reach the server. Please try again.";

type MutationError = {
  message?: string | null;
  fields?: readonly string[] | null;
};

export type SubmissionErrors = {
  form?: string;
  fields: Record<string, string>;
};

export const noSubmissionErrors: SubmissionErrors = {
  form: undefined,
  fields: {},
};

export const unexpectedSubmissionError: SubmissionErrors = {
  form: FALLBACK_MESSAGE,
  fields: {},
};

function joinMessages(errors: readonly MutationError[]): string {
  const message = errors
    .map((item) => item.message)
    .filter(Boolean)
    .join(" ");

  return message || FALLBACK_MESSAGE;
}

export function getApiErrorMessage(error: CombinedError): string {
  return error.networkError
    ? NETWORK_MESSAGE
    : joinMessages(error.graphQLErrors);
}

export function getSubmissionErrors(
  error: CombinedError | undefined,
  mutationErrors: readonly MutationError[] | null | undefined,
): SubmissionErrors {
  if (error != null) {
    return { form: getApiErrorMessage(error), fields: {} };
  }

  const errors = mutationErrors ?? [];

  const fields = Object.fromEntries(
    errors.flatMap((item) =>
      (item.fields ?? []).map((field) => [
        field,
        item.message ?? FALLBACK_MESSAGE,
      ]),
    ),
  );

  const formErrors = errors.filter((item) => !item.fields?.length);

  if (formErrors.length > 0) {
    return { form: joinMessages(formErrors), fields };
  }

  return {
    form: Object.keys(fields).length > 0 ? undefined : FALLBACK_MESSAGE,
    fields,
  };
}
