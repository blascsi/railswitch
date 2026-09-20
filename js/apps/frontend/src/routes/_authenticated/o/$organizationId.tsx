import { createFileRoute, Outlet } from "@tanstack/react-router";
import { Provider } from "urql";

import { organizationClient } from "../../../graphql/client";

export const Route = createFileRoute("/_authenticated/o/$organizationId")({
  // No membership check: the client's organization list can lag, so gating on
  // it rejected valid deep links. The server is the authority, and
  // `RouteQueryError` turns its refusal into the organization picker.
  beforeLoad: ({ params }) => ({
    client: organizationClient(params.organizationId),
  }),
  component: OrganizationScope,
});

function OrganizationScope() {
  const { client } = Route.useRouteContext();
  const { organizationId } = Route.useParams();

  return (
    <Provider value={client}>
      {/* Keyed so nothing below carries state from the organization we left. */}
      <Outlet key={organizationId} />
    </Provider>
  );
}
