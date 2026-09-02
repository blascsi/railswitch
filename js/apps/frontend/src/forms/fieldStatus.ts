type FieldErrorStatus = {
  type: "error";
  message: string;
};

function toMessage(error: unknown): string {
  if (typeof error === "string") {
    return error;
  }

  return (error as { message?: string }).message ?? "Invalid value";
}

export function errorMessages(errors: readonly unknown[]): string[] {
  return [...new Set(errors.filter((error) => error != null).map(toMessage))];
}

export function fieldErrorStatus(
  errors: readonly unknown[],
): FieldErrorStatus | undefined {
  const messages = errorMessages(errors);

  if (messages.length === 0) {
    return undefined;
  }

  return { type: "error", message: messages.join(", ") };
}
