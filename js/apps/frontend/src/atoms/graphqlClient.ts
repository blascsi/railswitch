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
