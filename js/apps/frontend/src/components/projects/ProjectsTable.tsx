import { proportional, Table } from "@astryxdesign/core/Table";
import { type FragmentOf, graphql, readFragment } from "../../graphql/graphql";
import { LinkAnchor } from "../routing/link-components/LinkAnchor";

export const projectsTable_projects = graphql(`
  fragment projectsTable_projects on Project {
    id
    name
  }
`);

type ProjectRow = {
  id: string;
  name: string;
};

type ProjectsTableProps = {
  projects: readonly FragmentOf<typeof projectsTable_projects>[];
};

export function ProjectsTable({ projects }: ProjectsTableProps) {
  const rows = readFragment(projectsTable_projects, projects);

  return (
    <Table<ProjectRow>
      data={[...rows]}
      idKey="id"
      columns={[
        {
          key: "name",
          header: "Name",
          width: proportional(1),
          renderCell: (project) => (
            <LinkAnchor
              to="/project/$projectName"
              params={{ projectName: project.name }}
            >
              {project.name}
            </LinkAnchor>
          ),
        },
      ]}
    />
  );
}
