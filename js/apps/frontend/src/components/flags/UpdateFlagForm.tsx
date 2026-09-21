import { FieldLabel } from "@astryxdesign/core/Field";
import { Card, Layout, LayoutHeader } from "@astryxdesign/core/Layout";
import { HStack } from "@astryxdesign/core/Stack";
import { colorVars } from "@astryxdesign/core/theme/tokens.stylex";
import * as stylex from "@stylexjs/stylex";
import { useState } from "react";
import { useQuery } from "urql";

import { graphql, readFragment, type FragmentOf } from "../../graphql/graphql";
import {
  EnvironmentSelector,
  environmentSelector_environments,
} from "../environments/EnvironmentSelector";
import { FlagEnvironmentRulesForm } from "./FlagEnvironmentRulesForm";

export const updateFlagForm_flag = graphql(
  `
    fragment updateFlagForm_flag on Flag {
      id
      project {
        environments(sort: [{ field: NAME, order: ASC }]) {
          id
          ...environmentSelector_environments
        }
      }
    }
  `,
  [environmentSelector_environments],
);

const FlagEnvironmentQuery = graphql(`
  query FlagEnvironmentQuery(
    $flag: FlagEnvironmentFilterFlagId!
    $environment: FlagEnvironmentFilterEnvironmentId!
  ) {
    listFlagEnvironments(
      filter: { environmentId: $environment, flagId: $flag }
    ) {
      results {
        id
        rules
      }
    }
  }
`);

const styles = stylex.create({
  headerFooter: {
    backgroundColor: colorVars["--color-background-muted"],
  },
});

type UpdateFlagFormProps = {
  flag: FragmentOf<typeof updateFlagForm_flag>;
};

export function UpdateFlagForm({ flag }: UpdateFlagFormProps) {
  const { id: flagId, project } = readFragment(updateFlagForm_flag, flag);
  const environments = project.environments;
  const [selectedEnvironment, setSelectedEnvironment] = useState<string | null>(
    environments?.[0]?.id ?? null,
  );
  const [flagEnvironments] = useQuery({
    query: FlagEnvironmentQuery,
    variables: {
      flag: { eq: flagId },
      environment: { eq: selectedEnvironment },
    },
    pause: selectedEnvironment == null,
  });
  const flagEnvironment =
    flagEnvironments.data?.listFlagEnvironments?.results?.[0];

  const header = (
    <LayoutHeader hasDivider xstyle={styles.headerFooter}>
      <HStack gap={2}>
        <FieldLabel inputID="environment_selector" label="Environment" />
        <EnvironmentSelector
          id="environment_selector"
          label=""
          isLabelHidden={true}
          environments={environments}
          value={selectedEnvironment ?? undefined}
          onChange={setSelectedEnvironment}
        />
      </HStack>
    </LayoutHeader>
  );

  if (flagEnvironment == null) {
    return (
      <Card>
        <Layout header={header} />
      </Card>
    );
  }

  return (
    <FlagEnvironmentRulesForm
      key={flagEnvironment.id}
      flagEnvironmentId={flagEnvironment.id}
      rules={flagEnvironment.rules}
      header={header}
    />
  );
}
