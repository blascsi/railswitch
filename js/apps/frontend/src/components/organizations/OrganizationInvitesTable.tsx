import { Button } from "@astryxdesign/core/Button";
import { ButtonGroup } from "@astryxdesign/core/ButtonGroup";
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

export const organizationInvitesTable_invites = graphql(`
  fragment organizationInvitesTable_invites on Membership {
    id
    role
    status
    organizationName
  }
`);

type InviteRow = {
  id: string;
  role: ResultOf<typeof organizationInvitesTable_invites>["role"];
  status: ResultOf<typeof organizationInvitesTable_invites>["status"];
  organizationName: string;
};

type OrganizationInvitesTableProps = {
  invites: readonly FragmentOf<typeof organizationInvitesTable_invites>[];
};

export function OrganizationInvitesTable({
  invites,
}: OrganizationInvitesTableProps) {
  const rows = readFragment(organizationInvitesTable_invites, invites);

  return (
    <Card>
      <Table<InviteRow>
        data={[...rows]}
        idKey="id"
        columns={[
          {
            key: "organizationName",
            header: "Organization name",
            width: proportional(2),
            renderCell: (invite) => <Text>{invite.organizationName}</Text>,
          },
          {
            key: "role",
            header: "Role",
            width: proportional(1),
            renderCell: (invite) => (
              <OrganizationMemberRole role={invite.role} />
            ),
          },

          {
            key: "status",
            header: "Status",
            width: proportional(1),
            renderCell: (_invite) => (
              <ButtonGroup label="Organization membership invite actions">
                <Button label="Decline" />
                <Button label="Accept" />
              </ButtonGroup>
            ),
          },
        ]}
      />
    </Card>
  );
}
