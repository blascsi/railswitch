import { createRootRoute, HeadContent, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { graphqlClientAtom } from "../atoms/graphqlClient";
import { PageErrorBoundary } from "../components/layout/PageErrorBoundary";
import { RouteProgress } from "../components/routing/RouteProgress";
import { store } from "../store";
import { pageTitle } from "../utils/pageTitle";

export const Route = createRootRoute({
  beforeLoad: () => ({
    client: store.get(graphqlClientAtom),
  }),
  head: () => ({ meta: [{ title: pageTitle() }] }),
  component: () => (
    <PageErrorBoundary>
      <HeadContent />
      <RouteProgress />
      <Outlet />
      <TanStackRouterDevtools />
    </PageErrorBoundary>
  ),
});
