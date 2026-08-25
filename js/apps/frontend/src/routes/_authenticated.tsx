import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { currentUserAtom } from "../atoms/currentUser";
import {
  crossOrganizationClientAtom,
  graphqlClientAtom,
} from "../atoms/graphqlClient";
import {
  organizationsAtom,
  setOrganizationsAtom,
} from "../atoms/organizations";
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
  beforeLoad: async () => {
    if (store.get(currentUserAtom) == null) {
      throw redirect({ to: "/login" });
    }

    const revalidate = loadQuery(
      store.get(crossOrganizationClientAtom),
      AuthenticatedLayoutQuery,
      {},
    ).then((result) => {
      store.set(
        setOrganizationsAtom,
        result.data?.listOrganizations?.results ?? [],
      );
    });

    // If the organizationsAtom is empty wait until it's data
    // is ready, otherwise refresh in the background
    if (store.get(organizationsAtom) == null) {
      await revalidate;
    } else {
      revalidate.catch(() => {});
    }

    // Re-read after reconciling, so this load already runs against the
    // organization it settled on rather than the one it started with.
    return { client: store.get(graphqlClientAtom) };
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
