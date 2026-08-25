import { atom } from "jotai";
import { makeClient } from "../graphql/client";
import { currentOrganizationIdAtom } from "./currentOrganizationId";
import { currentUserAtom } from "./currentUser";

/**
 * The urql client, recreated (dropping its cache) whenever the
 * current organization changes or the signed-in user changes, so cached
 * results never leak across organizations or users.
 */
export const graphqlClientAtom = atom((get) =>
  makeClient({
    organizationId: get(currentOrganizationIdAtom),
    userId: get(currentUserAtom)?.id ?? null,
  }),
);

/**
 * A client that sends no organization scope, for the queries that decide
 * what the scope should be. The backend filters by the `x-organization-id`
 * tenant, so asking which organizations a user belongs to through the
 * tenanted client answers nothing once the stored organization is stale.
 */
export const crossOrganizationClientAtom = atom((get) =>
  makeClient({
    organizationId: null,
    userId: get(currentUserAtom)?.id ?? null,
  }),
);
