import { currentUserAtom } from "../atoms/currentUser";
import { lastOrganizationIdAtom } from "../atoms/lastOrganizationId";
import { resetGraphqlClients } from "../graphql/client";
import { router } from "../router";
import { store } from "../store";

export function clearSession() {
  // Ahead of the atom write, which navigates to /login synchronously and would
  // otherwise carry the outgoing session's client onto that page.
  resetGraphqlClients();
  store.set(currentUserAtom, null);
  store.set(lastOrganizationIdAtom, null);
  router.invalidate();
}
