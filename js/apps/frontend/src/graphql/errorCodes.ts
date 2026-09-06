import type { CombinedError } from "urql";

/** Mirrors the codes rendered by `RailswitchBackendWeb.GraphqlErrors`. */
export const errorCodes = {
  notOrganizationMember: "not_organization_member",
  tenantNotProvided: "tenant_not_provided",
} as const;

export function hasErrorCode(error: CombinedError, code: string) {
  return error.graphQLErrors.some(
    (graphQLError) => graphQLError.extensions?.code === code,
  );
}
