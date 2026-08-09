import { createRootRoute, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { graphqlClientAtom } from "../atoms/graphqlClient";
import { PageErrorBoundary } from "../components/layout/PageErrorBoundary";
import { store } from "../store";

export const Route = createRootRoute({
  beforeLoad: () => ({
    client: store.get(graphqlClientAtom),
  }),
  component: () => (
    <PageErrorBoundary>
      <Outlet />
      <TanStackRouterDevtools />
    </PageErrorBoundary>
  ),
});
