import { Section } from "@astryxdesign/core/Section";
import type { ErrorComponentProps } from "@tanstack/react-router";
import { CombinedError } from "urql";

import { errorCodes, hasErrorCode } from "../../graphql/errorCodes";
import { QueryError } from "../feedback/QueryError";
import { OrganizationUnavailable } from "./OrganizationUnavailable";

export function RouteQueryError({ error, reset }: ErrorComponentProps) {
  // Either the organization in the URL is not ours, or it was malformed and
  // never became a tenant. Same recovery: pick a different one.
  if (
    error instanceof CombinedError &&
    (hasErrorCode(error, errorCodes.notOrganizationMember) ||
      hasErrorCode(error, errorCodes.tenantNotProvided))
  ) {
    return <OrganizationUnavailable />;
  }

  return (
    <Section variant="transparent">
      <QueryError
        title="Failed to load this page"
        error={error}
        onRetry={reset}
      />
    </Section>
  );
}
