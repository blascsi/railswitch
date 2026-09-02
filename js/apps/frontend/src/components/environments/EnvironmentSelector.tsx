import { Selector, type SelectorProps } from "@astryxdesign/core/Selector";
import { type FragmentOf, graphql, readFragment } from "../../graphql/graphql";

export const environmentSelector_environments = graphql(`
  fragment environmentSelector_environments on Environment {
    id
    name
  }
`);

type EnvironmentSelectorProps = {
  environments: readonly FragmentOf<typeof environmentSelector_environments>[];
} & Omit<Extract<SelectorProps, { hasClear?: false }>, "options">;

export function EnvironmentSelector({
  environments,
  ...selectorProps
}: EnvironmentSelectorProps) {
  const environmentsData = readFragment(
    environmentSelector_environments,
    environments,
  );

  const environmentOptions = environmentsData.map((environment) => ({
    value: environment.id,
    label: environment.name,
  }));

  return <Selector options={environmentOptions} {...selectorProps} />;
}
