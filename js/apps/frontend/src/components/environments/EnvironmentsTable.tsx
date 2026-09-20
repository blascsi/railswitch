import { proportional, Table } from "@astryxdesign/core/Table";
import { Text } from "@astryxdesign/core/Text";

import { graphql, readFragment, type FragmentOf } from "../../graphql/graphql";
import { MonospaceToken } from "../MonospaceToken";
import { LinkAnchor } from "../routing/link-components/LinkAnchor";

export const environmentsTable_environments = graphql(`
  fragment environmentsTable_environments on Environment {
    id
    name
    project {
      id
      name
    }
  }
`);

type EnvironmentRow = {
  id: string;
  name: string;
  project: { id: string; name: string };
};

type EnvironmentsTableProps = {
  environments: readonly FragmentOf<typeof environmentsTable_environments>[];
};

export function EnvironmentsTable({ environments }: EnvironmentsTableProps) {
  const rows = readFragment(environmentsTable_environments, environments);

  return (
    <Table<EnvironmentRow>
      data={[...rows]}
      idKey="id"
      columns={[
        {
          key: "name",
          header: "Name",
          width: proportional(1),
          renderCell: (environment) => (
            <LinkAnchor
              from="/o/$organizationId"
              to="/o/$organizationId/project/$projectName/environment/$environmentName"
              params={{
                projectName: environment.project.name,
                environmentName: environment.name,
              }}
            >
              <Text type="code">{environment.name}</Text>
            </LinkAnchor>
          ),
        },
        {
          key: "project",
          header: "Project",
          width: proportional(1),
          renderCell: (environment) => (
            <LinkAnchor
              from="/o/$organizationId"
              to="/o/$organizationId/project/$projectName"
              params={{ projectName: environment.project.name }}
            >
              <MonospaceToken label={environment.project.name} />
            </LinkAnchor>
          ),
        },
      ]}
    />
  );
}
