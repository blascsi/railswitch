import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { currentUserAtom } from "../atoms/currentUser";
import { organizationSelectorOptionsAtom } from "../atoms/organizationSelectorOptions";
import { AppShellLayout } from "../components/layout/AppShellLayout";
import { graphql } from "../graphql/graphql";
import { store } from "../store";
import { loadQuery } from "../utils/loadQuery";

export const AuthenticatedLayoutQuery = graphql(`
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
    const layout = await loadQuery(
      context.client,
      AuthenticatedLayoutQuery,
      {},
    );

    store.set(
      organizationSelectorOptionsAtom,
      (layout.data?.listOrganizations?.results ?? []).map((organization) => ({
        label: organization.name,
        value: organization.id,
      })),
    );
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  return (
    <AppShellLayout>
      <Outlet />
    </AppShellLayout>
  );
}
