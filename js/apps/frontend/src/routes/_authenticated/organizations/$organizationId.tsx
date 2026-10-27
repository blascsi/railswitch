import { EmptyState } from "@astryxdesign/core/EmptyState";
import { Heading } from "@astryxdesign/core/Heading";
import { VStack } from "@astryxdesign/core/VStack";
import { createFileRoute, notFound } from "@tanstack/react-router";

import { AppIcon } from "../../../components/AppIcon";
import { CenteredContent } from "../../../components/layout/CenteredContent";
import {
  OrganizationMembersTable,
  organizationMembersTable_members,
} from "../../../components/organizations/OrganizationMembersTable";
import {
  UpdateOrganizationForm,
  updateOrganizationForm_organization,
} from "../../../components/organizations/UpdateOrganizationForm";
import { graphql } from "../../../graphql/graphql";
import { loaderQuery } from "../../../graphql/loaderQuery";
import { pageTitle } from "../../../utils/pageTitle";

const OrganizationPageQuery = graphql(
  `
    query OrganizationPageQuery($id: ID!) {
      getOrganization(id: $id) {
        name
        ...updateOrganizationForm_organization
        acceptedMemberships {
          ...organizationMembersTable_members
        }
      }
    }
  `,
  [updateOrganizationForm_organization, organizationMembersTable_members],
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
  component: OrganizationEditPage,
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

function OrganizationEditPage() {
  const loaderData = Route.useLoaderData();
  const { organization } = loaderData;

  return (
    <VStack gap={4}>
      <Heading level={1}>Organization details</Heading>
      <VStack gap={3}>
        <UpdateOrganizationForm organization={organization} />
        <Heading level={2}>Members</Heading>
        <OrganizationMembersTable
          members={organization.acceptedMemberships ?? []}
        />
      </VStack>
    </VStack>
  );
}
