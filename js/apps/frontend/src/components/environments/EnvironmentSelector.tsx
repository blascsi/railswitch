import { Select, type SelectProps } from "@mantine/core";
import { type FragmentOf, graphql, readFragment } from "../../graphql/graphql";

export const environmentSelector_environments = graphql(`
  fragment environmentSelector_environments on Environment {
    id
    name
  }
`);

type EnvironmentSelectorProps = {
  environments: readonly FragmentOf<typeof environmentSelector_environments>[];
} & Omit<SelectProps, "data">;

export function EnvironmentSelector({
  environments,
  ...selectProps
}: EnvironmentSelectorProps) {
  const environmentsData = readFragment(
    environmentSelector_environments,
    environments,
  );

  const environmentOptions = environmentsData.map((environment) => ({
    value: environment.id,
    label: environment.name,
  }));

  return <Select data={environmentOptions} {...selectProps} />;
}
