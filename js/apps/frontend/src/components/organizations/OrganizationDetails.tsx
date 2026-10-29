import { Heading } from "@astryxdesign/core/Heading";
import { Text } from "@astryxdesign/core/Text";
import { VStack } from "@astryxdesign/core/VStack";

import { graphql, readFragment, type FragmentOf } from "../../graphql/graphql";
import {
  OrganizationMembersTable,
  organizationMembersTable_members,
} from "./OrganizationMembersTable";

export const organizationDetails_organization = graphql(
  `
    fragment organizationDetails_organization on Organization {
      name
      acceptedMemberships {
        ...organizationMembersTable_members
      }
    }
  `,
  [organizationMembersTable_members],
);

type OrganizationDetailsProps = {
  organization: FragmentOf<typeof organizationDetails_organization>;
};

export function OrganizationDetails({
  organization,
}: OrganizationDetailsProps) {
  const organizationData = readFragment(
    organizationDetails_organization,
    organization,
  );

  return (
    <VStack gap={4}>
      <Heading level={1}>Organization details</Heading>
      <VStack gap={3}>
        <VStack gap={1}>
          <Text type="supporting">Name</Text>
          <Text>{organizationData.name}</Text>
        </VStack>
        <Heading level={2}>Members</Heading>
        <OrganizationMembersTable
          members={organizationData.acceptedMemberships ?? []}
        />
      </VStack>
    </VStack>
  );
}
