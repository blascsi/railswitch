import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/o/$organizationId/")({
  beforeLoad: ({ params }) => {
    throw redirect({ to: "/o/$organizationId/projects", params });
  },
});
