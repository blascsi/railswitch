import { Card } from "@astryxdesign/core/Card";
import { proportional, Table } from "@astryxdesign/core/Table";
import { Text } from "@astryxdesign/core/Text";

import {
  graphql,
  readFragment,
  type FragmentOf,
  type ResultOf,
} from "../../graphql/graphql";
import { OrganizationMemberRole } from "../memberships/OrganizationMemberRole";

export const organizationMembersTable_members = graphql(`
  fragment organizationMembersTable_members on Membership {
    id
    role
    user {
      email
    }
  }
`);

type OrganizationMemberRow = {
  id: string;
  role: ResultOf<typeof organizationMembersTable_members>["role"];
  email: string;
};

type OrganizationMembersTableProps = {
  members: readonly FragmentOf<typeof organizationMembersTable_members>[];
};

export function OrganizationMembersTable({
  members,
}: OrganizationMembersTableProps) {
  const rows = readFragment(organizationMembersTable_members, members).map(
    (memberData) => ({
      id: memberData.id,
      role: memberData.role,
      email: memberData.user.email,
    }),
  );

  return (
    <Card>
      <Table<OrganizationMemberRow>
        data={[...rows]}
        idKey="id"
        columns={[
          {
            key: "email",
            header: "Email",
            width: proportional(2),
            renderCell: (member) => <Text type="code">{member.email}</Text>,
          },
          {
            key: "role",
            header: "Role",
            width: proportional(1),
            renderCell: (member) => (
              <OrganizationMemberRole role={member.role} />
            ),
          },
        ]}
      />
    </Card>
  );
}
