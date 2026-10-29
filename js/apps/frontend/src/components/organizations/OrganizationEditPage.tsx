import { Heading } from "@astryxdesign/core/Heading";
import { VStack } from "@astryxdesign/core/VStack";

import { graphql, readFragment, type FragmentOf } from "../../graphql/graphql";
import { OrganizationMemberInviteInput } from "../memberships/OrganizationMemberInviteInput";
import {
  OrganizationMembersTable,
  organizationMembersTable_members,
} from "./OrganizationMembersTable";
import {
  UpdateOrganizationForm,
  updateOrganizationForm_organization,
} from "./UpdateOrganizationForm";

export const organizationEditPage_organization = graphql(
  `
    fragment organizationEditPage_organization on Organization {
      ...updateOrganizationForm_organization
      acceptedMemberships {
        ...organizationMembersTable_members
      }
    }
  `,
  [updateOrganizationForm_organization, organizationMembersTable_members],
);

type OrganizationEditPageProps = {
  organization: FragmentOf<typeof organizationEditPage_organization>;
};

export function OrganizationEditPage({
  organization,
}: OrganizationEditPageProps) {
  const organizationData = readFragment(
    organizationEditPage_organization,
    organization,
  );

  return (
    <VStack gap={4}>
      <Heading level={1}>Organization details</Heading>
      <VStack gap={3}>
        <UpdateOrganizationForm organization={organizationData} />
        <Heading level={2}>Members</Heading>
        <OrganizationMemberInviteInput />
        <OrganizationMembersTable
          members={organizationData.acceptedMemberships ?? []}
        />
      </VStack>
    </VStack>
  );
}
