import { Stack, Table } from "@mantine/core";
import { type FragmentOf, graphql, readFragment } from "../../graphql/graphql";
import { LinkAnchor } from "../routing/link-components/LinkAnchor";

export const projectsTable_projects = graphql(`
  fragment projectsTable_projects on Project {
    id
    name
  }
`);

type ProjectsTableProps = {
  projects: readonly FragmentOf<typeof projectsTable_projects>[];
};

export function ProjectsTable({ projects }: ProjectsTableProps) {
  const rows = readFragment(projectsTable_projects, projects);

  return (
    <Stack>
      <Table>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Name</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {rows.map((project) => (
            <Table.Tr key={project.id}>
              <Table.Td>
                <LinkAnchor to="/projects/$id" params={{ id: project.id }}>
                  {project.name}
                </LinkAnchor>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Stack>
  );
}
