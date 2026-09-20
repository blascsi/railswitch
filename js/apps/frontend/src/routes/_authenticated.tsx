import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { currentUserAtom } from "../atoms/currentUser";
import { AppShellLayout } from "../components/layout/AppShellLayout";
import { graphql } from "../graphql/graphql";
import { loaderQuery } from "../graphql/loaderQuery";
import { store } from "../store";

const AuthenticatedLayoutQuery = graphql(`
  query AuthenticatedLayout {
    listOrganizations {
      results {
        id
        name
      }
    }
  }
`);

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: () => {
    if (store.get(currentUserAtom) == null) {
      throw redirect({ to: "/login" });
    }
  },
  loader: async ({ context }) => {
    const data = await loaderQuery(
      context.client,
      AuthenticatedLayoutQuery,
      {},
      { requestPolicy: "network-only" },
    );

    return data.listOrganizations?.results ?? [];
  },
  staleTime: 30_000,
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  return (
    <AppShellLayout>
      <Outlet />
    </AppShellLayout>
  );
}
