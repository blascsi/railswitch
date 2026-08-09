import { type CurrentUser, currentUserAtom } from "../atoms/currentUser";
import { router } from "../router";
import { store } from "../store";

export function onAuthenticationSuccess(user: CurrentUser) {
  store.set(currentUserAtom, user);
  router.navigate({ to: "/home" });
}
