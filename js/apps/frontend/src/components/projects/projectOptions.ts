import { graphql, readFragment, type FragmentOf } from "../../graphql/graphql";

export const projectSelector_projects = graphql(`
  fragment projectSelector_projects on Project {
    id
    name
  }
`);

export function projectOptions(
  projects: readonly FragmentOf<typeof projectSelector_projects>[],
) {
  return readFragment(projectSelector_projects, projects).map((project) => ({
    value: project.id,
    label: project.name,
  }));
}
