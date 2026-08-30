import { Stack, Table } from "@mantine/core";
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

type EnvironmentsTableProps = {
  environments: readonly FragmentOf<typeof environmentsTable_environments>[];
};

export function EnvironmentsTable({ environments }: EnvironmentsTableProps) {
  const rows = readFragment(environmentsTable_environments, environments);

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
          {rows.map((environment) => (
            <Table.Tr key={environment.id}>
              <Table.Td>
                <LinkAnchor
                  to="/project/$projectName/environment/$environmentName"
                  params={{
                    projectName: environment.project.name,
                    environmentName: environment.name,
                  }}
                >
                  {environment.name}
                </LinkAnchor>
              </Table.Td>
              <Table.Td>
                <LinkAnchor
                  to="/project/$projectName"
                  params={{ projectName: environment.project.name }}
                >
                  {environment.project.name}
                </LinkAnchor>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Stack>
  );
}
