import { createFileRoute, notFound, Outlet } from "@tanstack/react-router";
import { currentOrganizationIdAtom } from "../../atoms/currentOrganizationId";
import { NoOrganizationSelected } from "../../components/routing/NoOrganizationSelected";
import { store } from "../../store";

export const Route = createFileRoute("/_authenticated/_organizationRequired")({
  beforeLoad: () => {
    const organizationId = store.get(currentOrganizationIdAtom);
    if (organizationId == null) {
      throw notFound();
    }
  },
  component: Outlet,
  notFoundComponent: NoOrganizationSelected,
});
