import { createFileRoute, Outlet } from "@tanstack/react-router";
import { Provider } from "urql";
import { lastOrganizationIdAtom } from "../../../atoms/lastOrganizationId";
import { organizationClient } from "../../../graphql/client";
import { store } from "../../../store";

export const Route = createFileRoute("/_authenticated/o/$organizationId")({
  // No membership check: the persisted organization list can be stale, so
  // gating on it rejected valid deep links. The server is the authority, and
  // `RouteQueryError` turns its refusal into the organization picker.
  beforeLoad: ({ params }) => {
    store.set(lastOrganizationIdAtom, params.organizationId);

    return { client: organizationClient(params.organizationId) };
  },
  component: OrganizationScope,
});

function OrganizationScope() {
  const { client } = Route.useRouteContext();

  return (
    <Provider value={client}>
      <Outlet />
    </Provider>
  );
}
