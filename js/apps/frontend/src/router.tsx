import { createRouter } from "@tanstack/react-router";

import { currentUserAtom } from "./atoms/currentUser";
import { FullPageLoader } from "./components/feedback/FullPageLoader";
import { NotFoundPage } from "./components/routing/NotFoundPage";
import { RouteQueryError } from "./components/routing/RouteQueryError";
import { routeTree } from "./routeTree.gen";
import { store } from "./store";

export const router = createRouter({
  routeTree,
  defaultPreload: "intent",
  defaultPendingComponent: FullPageLoader,
  defaultPendingMs: 2000,
  defaultNotFoundComponent: NotFoundPage,
  defaultErrorComponent: RouteQueryError,
});

// A session can end on any request's 401, from any route.
store.sub(currentUserAtom, () => {
  if (store.get(currentUserAtom) == null) {
    void router.navigate({ to: "/login" });
  }
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
