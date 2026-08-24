import { Select, type SelectProps } from "@mantine/core";
import { type FragmentOf, graphql, readFragment } from "../../graphql/graphql";

export const projectSelector_projects = graphql(
  `
  fragment projectSelector_projects on Project {
    id
    name
  }
`,
);

type ProjectSelectorProps = {
  projects: readonly FragmentOf<typeof projectSelector_projects>[];
} & Omit<SelectProps, "data">;

export function ProjectSelector({
  projects,
  ...selectProps
}: ProjectSelectorProps) {
  const projectsData = readFragment(projectSelector_projects, projects);

  const projectOptions = projectsData.map((project) => ({
    value: project.id,
    label: project.name,
  }));

  return <Select data={projectOptions} {...selectProps} />;
}
