import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { currentOrganizationIdAtom } from "../atoms/currentOrganizationId";
import { currentUserAtom } from "../atoms/currentUser";
import { organizationsAtom } from "../atoms/organizations";
import { store } from "../store";

export const Route = createFileRoute("/_anonymous")({
  beforeLoad: () => {
    if (store.get(currentUserAtom) != null) {
      throw redirect({ to: "/home" });
    }

    store.set(organizationsAtom, null);
    store.set(currentOrganizationIdAtom, null);
  },
  component: Outlet,
});
