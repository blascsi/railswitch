import { createRootRoute, HeadContent, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { Provider } from "urql";
import { PageErrorBoundary } from "../components/layout/PageErrorBoundary";
import { RouteProgress } from "../components/routing/RouteProgress";
import { crossOrganizationClient } from "../graphql/client";
import { pageTitle } from "../utils/pageTitle";

export const Route = createRootRoute({
  beforeLoad: () => ({
    client: crossOrganizationClient(),
  }),
  head: () => ({ meta: [{ title: pageTitle() }] }),
  component: RootLayout,
});

function RootLayout() {
  const { client } = Route.useRouteContext();

  return (
    <Provider value={client}>
      <PageErrorBoundary>
        <HeadContent />
        <RouteProgress />
        <Outlet />
        <TanStackRouterDevtools />
      </PageErrorBoundary>
    </Provider>
  );
}
