import type { CombinedError } from "urql";

const FALLBACK_MESSAGE = "Something went wrong. Please try again.";

type MutationErrorLike = {
  message?: string | null;
  fields?: readonly string[] | null;
};

function joinMessages(errors: readonly MutationErrorLike[]): string {
  const message = errors
    .map((item) => item.message)
    .filter(Boolean)
    .join(" ");
  return message || FALLBACK_MESSAGE;
}

export function getApiErrorMessage(
  error: CombinedError | null | undefined,
): string {
  if (error?.networkError) {
    return "Could not reach the server. Please try again.";
  }

  return joinMessages(error?.graphQLErrors ?? []);
}

export function getMutationErrorMessage(
  error: CombinedError | null | undefined,
  payloadErrors: readonly MutationErrorLike[] | null | undefined,
): string | null {
  if (error) {
    return getApiErrorMessage(error);
  }

  const formErrors = payloadErrors?.filter((item) => !item.fields?.length);
  return formErrors?.length ? joinMessages(formErrors) : null;
}

export function getMutationFieldErrors(
  payloadErrors: readonly MutationErrorLike[] | null | undefined,
): Record<string, string> {
  return Object.fromEntries(
    (payloadErrors ?? []).flatMap((item) =>
      (item.fields ?? []).map((field) => [
        field,
        item.message ?? FALLBACK_MESSAGE,
      ]),
    ),
  );
}
