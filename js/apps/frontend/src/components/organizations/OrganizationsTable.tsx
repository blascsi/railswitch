import { Card } from "@astryxdesign/core/Card";
import { proportional, Table } from "@astryxdesign/core/Table";
import { Text } from "@astryxdesign/core/Text";

import { graphql, readFragment, type FragmentOf } from "../../graphql/graphql";
import { LinkAnchor } from "../routing/link-components/LinkAnchor";

export const organizationsTable_organizations = graphql(`
  fragment organizationsTable_organizations on Organization {
    id
    name
  }
`);

type OrganizationRow = {
  id: string;
  name: string;
};

type OrganizationsTableProps = {
  organizations: readonly FragmentOf<typeof organizationsTable_organizations>[];
};

export function OrganizationsTable({ organizations }: OrganizationsTableProps) {
  const rows = readFragment(organizationsTable_organizations, organizations);

  return (
    <Card>
      <Table<OrganizationRow>
        data={[...rows]}
        idKey="id"
        columns={[
          {
            key: "name",
            header: "Name",
            width: proportional(1),
            renderCell: (organization) => (
              <LinkAnchor
                to="/organizations/$organizationId"
                params={{ organizationId: organization.id }}
              >
                <Text>{organization.name}</Text>
              </LinkAnchor>
            ),
          },
        ]}
      />
    </Card>
  );
}
