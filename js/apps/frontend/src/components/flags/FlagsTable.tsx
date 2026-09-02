import { proportional, Table } from "@astryxdesign/core/Table";
import { type FragmentOf, graphql, readFragment } from "../../graphql/graphql";
import { LinkAnchor } from "../routing/link-components/LinkAnchor";

export const flagsTable_flags = graphql(`
  fragment flagsTable_flags on Flag {
    id
    name
    project {
      id
      name
    }
  }
`);

type FlagRow = {
  id: string;
  name: string;
  project: { id: string; name: string };
};

type FlagsTableProps = {
  flags: readonly FragmentOf<typeof flagsTable_flags>[];
};

export function FlagsTable({ flags }: FlagsTableProps) {
  const rows = readFragment(flagsTable_flags, flags);

  return (
    <Table<FlagRow>
      data={[...rows]}
      idKey="id"
      columns={[
        {
          key: "name",
          header: "Name",
          width: proportional(1),
          renderCell: (flag) => (
            <LinkAnchor
              to="/project/$projectName/flag/$flagName"
              params={{ projectName: flag.project.name, flagName: flag.name }}
            >
              {flag.name}
            </LinkAnchor>
          ),
        },
        {
          key: "project",
          header: "Project",
          width: proportional(1),
          renderCell: (flag) => (
            <LinkAnchor
              to="/project/$projectName"
              params={{ projectName: flag.project.name }}
            >
              {flag.project.name}
            </LinkAnchor>
          ),
        },
      ]}
    />
  );
}
