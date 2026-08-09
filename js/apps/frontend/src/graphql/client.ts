import { devtoolsExchange } from "@urql/devtools";
import { requestPolicyExchange } from "@urql/exchange-request-policy";
import { Client, cacheExchange, type Exchange, fetchExchange } from "urql";
import { exhaustiveAdditionalTypenamesExchange } from "urql-exhaustive-additional-typenames-exchange";
import { pipe, tap } from "wonka";
import { currentUserAtom } from "../atoms/currentUser";
import { store } from "../store";
import { introspection } from "./introspection";

/**
 * The (user, organization) pair a client is created for. Both fields are
 * part of the client's cache identity: results cached under one scope
 * must never be served to another, so a new scope requires a new client.
 */
export type ClientScope = {
  organizationId: string | null;
  userId: string | null;
};

const exhaustiveTypenamesExchange = exhaustiveAdditionalTypenamesExchange({
  schema: introspection,
  debug: import.meta.env.DEV,
});

const sessionExchange: Exchange =
  ({ forward }) =>
  (operations$) =>
    pipe(
      forward(operations$),
      tap((result) => {
        if (result.error?.response?.status === 401) {
          store.set(currentUserAtom, null);
        }
      }),
    );

export function makeClient(scope: ClientScope) {
  return new Client({
    url: import.meta.env.VITE_API_URL ?? "http://localhost:4000/gql",
    // Overrides the "within-url-limit" default: GET would leak queries and
    // variables into access logs, and nothing here is CDN-cacheable anyway.
    preferGetMethod: false,
    exchanges: [
      ...(import.meta.env.DEV ? [devtoolsExchange] : []),
      requestPolicyExchange({ ttl: 60_000 }),
      exhaustiveTypenamesExchange,
      cacheExchange,
      sessionExchange,
      fetchExchange,
    ],
    fetchOptions: {
      credentials: "include",
      headers: {
        ...(scope.organizationId != null && {
          "x-organization-id": scope.organizationId,
        }),
        ...(scope.userId != null && { "x-session": "active" }),
      },
    },
  });
}
