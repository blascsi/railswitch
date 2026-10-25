import { Divider } from "@astryxdesign/core/Divider";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { Heading } from "@astryxdesign/core/Heading";
import { HStack } from "@astryxdesign/core/HStack";
import { VStack } from "@astryxdesign/core/VStack";
import { createFileRoute } from "@tanstack/react-router";

import { AppIcon } from "../../../components/AppIcon";
import { CenteredContent } from "../../../components/layout/CenteredContent";
import {
  OrganizationInvitesTable,
  organizationInvitesTable_invites,
} from "../../../components/organizations/OrganizationInvitesTable";
import {
  OrganizationsTable,
  organizationsTable_organizations,
} from "../../../components/organizations/OrganizationsTable";
import { LinkButton } from "../../../components/routing/link-components/LinkButton";
import { graphql } from "../../../graphql/graphql";
import { loaderQuery } from "../../../graphql/loaderQuery";
import { pageTitle } from "../../../utils/pageTitle";

const OrganizationListPageQuery = graphql(
  `
    query OrganizationsPageQuery {
      listOrganizations {
        count
        results {
          ...organizationsTable_organizations
        }
      }
      listMyInvitations {
        count
        results {
          ...organizationInvitesTable_invites
        }
      }
    }
  `,
  [organizationsTable_organizations, organizationInvitesTable_invites],
);

export const Route = createFileRoute("/_authenticated/organizations/")({
  loader: ({ context }) =>
    loaderQuery(context.client, OrganizationListPageQuery, {}),
  head: () => ({ meta: [{ title: pageTitle("Organizations") }] }),
  component: OrganizationListPage,
});

function OrganizationListPage() {
  const loaderData = Route.useLoaderData();
  const { listOrganizations, listMyInvitations } = loaderData;

  const organizationList =
    listOrganizations?.count === 0 ? (
      <CenteredContent>
        <EmptyState
          icon={<AppIcon icon="buildings" size="lg" />}
          title="No organizations found"
          description="You can get started by creating a new one, or checking your invites below."
        />
      </CenteredContent>
    ) : (
      <OrganizationsTable organizations={listOrganizations?.results ?? []} />
    );

  const inviteList =
    listMyInvitations?.count === 0 ? (
      <CenteredContent>
        <EmptyState
          icon={<AppIcon icon="envelope" size="lg" />}
          title="No invitations found"
          description="Please double check with the owner of the organization if you are expecting one."
        />
      </CenteredContent>
    ) : (
      <OrganizationInvitesTable invites={listMyInvitations?.results ?? []} />
    );

  return (
    <VStack gap={4}>
      <HStack hAlign="between" vAlign="center">
        <Heading level={1}>Organizations</Heading>
        <LinkButton
          to="/organizations/create"
          label="Create organization"
          icon={<AppIcon icon="plus" size="sm" />}
          variant="primary"
        />
      </HStack>
      {organizationList}
      <Divider />
      <Heading level={1}>Invites</Heading>
      {inviteList}
    </VStack>
  );
}
