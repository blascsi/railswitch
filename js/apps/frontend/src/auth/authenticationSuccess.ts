import { type CurrentUser, currentUserAtom } from "../atoms/currentUser";
import { resetGraphqlClients } from "../graphql/client";
import { router } from "../router";
import { store } from "../store";

export async function onAuthenticationSuccess(user: CurrentUser) {
  resetGraphqlClients();
  store.set(currentUserAtom, user);
  await router.invalidate();

  // Await, so the navigation only happens after
  // the data required to render the next route
  // is ready
  await router.navigate({ to: "/home" });
}
