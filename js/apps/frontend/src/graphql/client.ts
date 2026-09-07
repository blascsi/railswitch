import { devtoolsExchange } from "@urql/devtools";
import { Client, cacheExchange, type Exchange, fetchExchange } from "urql";
import { exhaustiveAdditionalTypenamesExchange } from "urql-exhaustive-additional-typenames-exchange";
import { pipe, tap } from "wonka";
import { currentUserAtom } from "../atoms/currentUser";
import { clearSession } from "../auth/clearSession";
import { store } from "../store";
import { introspection } from "./introspection";

const exhaustiveTypenamesExchange = exhaustiveAdditionalTypenamesExchange({
  schema: introspection,
  debug: import.meta.env.DEV,
});

// Bumped on every session change. A client created before the change keeps
// running its in-flight requests, and a 401 from one of those says the old
// session ended — not the current one.
let sessionGeneration = 0;

const sessionExchange =
  (generation: number): Exchange =>
  ({ forward }) =>
  (operations$) =>
    pipe(
      forward(operations$),
      tap((result) => {
        if (
          result.error?.response?.status === 401 &&
          generation === sessionGeneration
        ) {
          clearSession();
        }
      }),
    );

function makeClient(organizationId: string | null) {
  const generation = sessionGeneration;

  return new Client({
    url: import.meta.env.VITE_API_URL ?? "http://localhost:4000/gql",
    // Overrides the "within-url-limit" default: GET would leak queries and
    // variables into access logs, and nothing here is CDN-cacheable anyway.
    preferGetMethod: false,
    exchanges: [
      ...(import.meta.env.DEV ? [devtoolsExchange] : []),
      exhaustiveTypenamesExchange,
      cacheExchange,
      sessionExchange(generation),
      fetchExchange,
    ],
    // Read per request: the session header tracks the current user rather than
    // the one the client was created for.
    fetchOptions: () => ({
      credentials: "include",
      headers: {
        ...(organizationId != null && { "x-organization-id": organizationId }),
        ...(store.get(currentUserAtom) != null && { "x-session": "active" }),
      },
    }),
  });
}

let crossOrganization: Client | null = null;
let scoped: { organizationId: string; client: Client } | null = null;

/** The client for queries that decide the scope, and for signed-out requests. */
export function crossOrganizationClient() {
  crossOrganization ??= makeClient(null);
  return crossOrganization;
}

/**
 * Holding only the current organization's client means its cache dies on the
 * way out, so coming back refetches instead of serving what was true before.
 */
export function organizationClient(organizationId: string) {
  if (scoped?.organizationId !== organizationId) {
    scoped = { organizationId, client: makeClient(organizationId) };
  }

  return scoped.client;
}

export function resetGraphqlClients() {
  sessionGeneration += 1;
  crossOrganization = null;
  scoped = null;
}
