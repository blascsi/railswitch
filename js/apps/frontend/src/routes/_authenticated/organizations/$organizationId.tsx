import { EmptyState } from "@astryxdesign/core/EmptyState";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { useAtomValue } from "jotai";
import { Provider } from "urql";

import { currentUserAtom } from "../../../atoms/currentUser";
import { AppIcon } from "../../../components/AppIcon";
import { CenteredContent } from "../../../components/layout/CenteredContent";
import {
  OrganizationDetails,
  organizationDetails_organization,
} from "../../../components/organizations/OrganizationDetails";
import {
  OrganizationEditPage,
  organizationEditPage_organization,
} from "../../../components/organizations/OrganizationEditPage";
import { organizationClient } from "../../../graphql/client";
import { graphql } from "../../../graphql/graphql";
import { loaderQuery } from "../../../graphql/loaderQuery";
import { pageTitle } from "../../../utils/pageTitle";

const OrganizationPageQuery = graphql(
  `
    query OrganizationPageQuery($id: ID!) {
      getOrganization(id: $id) {
        name
        ...organizationEditPage_organization
        ...organizationDetails_organization
        acceptedMemberships {
          role
          user {
            id
          }
        }
      }
    }
  `,
  [organizationEditPage_organization, organizationDetails_organization],
);

export const Route = createFileRoute(
  "/_authenticated/organizations/$organizationId",
)({
  loader: async ({ context, params }) => {
    const { getOrganization: organization } = await loaderQuery(
      context.client,
      OrganizationPageQuery,
      { id: params.organizationId },
    );

    if (organization == null) {
      throw notFound();
    }

    return { organization };
  },
  head: ({ loaderData }) => ({
    meta: [{ title: pageTitle(loaderData?.organization?.name) }],
  }),
  component: OrganizationPage,
  notFoundComponent: OrganizationNotFound,
});

function OrganizationNotFound() {
  return (
    <CenteredContent>
      <EmptyState
        icon={<AppIcon icon="buildings" size="lg" />}
        title="Organization not found"
        description="Please double check the URL, and make sure that you are a member of the organization"
      />
    </CenteredContent>
  );
}

function OrganizationPage() {
  const loaderData = Route.useLoaderData();
  const { organization } = loaderData;
  const { organizationId } = Route.useParams();
  const currentUser = useAtomValue(currentUserAtom);

  const isOwner = (organization.acceptedMemberships ?? []).some(
    (membership) =>
      membership.user.id === currentUser?.id && membership.role === "OWNER",
  );

  return (
    <Provider value={organizationClient(organizationId)}>
      {isOwner ? (
        <OrganizationEditPage organization={organization} />
      ) : (
        <OrganizationDetails organization={organization} />
      )}
    </Provider>
  );
}
