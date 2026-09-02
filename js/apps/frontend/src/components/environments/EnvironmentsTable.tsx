import { proportional, Table } from "@astryxdesign/core/Table";
import { type FragmentOf, graphql, readFragment } from "../../graphql/graphql";
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
              to="/project/$projectName/environment/$environmentName"
              params={{
                projectName: environment.project.name,
                environmentName: environment.name,
              }}
            >
              {environment.name}
            </LinkAnchor>
          ),
        },
        {
          key: "project",
          header: "Project",
          width: proportional(1),
          renderCell: (environment) => (
            <LinkAnchor
              to="/project/$projectName"
              params={{ projectName: environment.project.name }}
            >
              {environment.project.name}
            </LinkAnchor>
          ),
        },
      ]}
    />
  );
}
