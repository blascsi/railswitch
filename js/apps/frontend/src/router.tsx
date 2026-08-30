import { createRouter } from "@tanstack/react-router";
import { currentUserAtom } from "./atoms/currentUser";
import { graphqlClientAtom } from "./atoms/graphqlClient";
import { FullPageLoader } from "./components/feedback/FullPageLoader";
import { NotFoundPage } from "./components/routing/NotFoundPage";
import { RouteQueryError } from "./components/routing/RouteQueryError";
import { routeTree } from "./routeTree.gen";
import { store } from "./store";

export const router = createRouter({
  routeTree,
  defaultPreload: "intent",
  defaultPendingComponent: FullPageLoader,
  defaultNotFoundComponent: NotFoundPage,
  defaultErrorComponent: RouteQueryError,
});

store.sub(graphqlClientAtom, () => {
  router.invalidate({ forcePending: true });
});

store.sub(currentUserAtom, () => {
  router.invalidate({ forcePending: true });
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
