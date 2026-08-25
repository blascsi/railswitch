import { Stack, Table } from "@mantine/core";
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

type FlagsTableProps = {
  flags: readonly FragmentOf<typeof flagsTable_flags>[];
};

export function FlagsTable({ flags }: FlagsTableProps) {
  const rows = readFragment(flagsTable_flags, flags);

  return (
    <Stack>
      <Table>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Name</Table.Th>
            <Table.Th>Project</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {rows.map((flag) => (
            <Table.Tr key={flag.id}>
              <Table.Td>
                <LinkAnchor to="/flags/$id" params={{ id: flag.id }}>
                  {flag.name}
                </LinkAnchor>
              </Table.Td>
              <Table.Td>
                <LinkAnchor to="/projects/$id" params={{ id: flag.project.id }}>
                  {flag.project.name}
                </LinkAnchor>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Stack>
  );
}
