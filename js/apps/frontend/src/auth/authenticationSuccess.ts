import { type CurrentUser, currentUserAtom } from "../atoms/currentUser";
import { router } from "../router";
import { store } from "../store";

export async function onAuthenticationSuccess(user: CurrentUser) {
  store.set(currentUserAtom, user);
  // Await, so the navigation only happens after
  // the data required to render the next route
  // is ready
  await router.navigate({ to: "/home" });
}
