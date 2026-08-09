import { EmptyState } from "@mantine/core";
import { BuildingOfficeIcon } from "@phosphor-icons/react";
import { CenteredContent } from "../layout/CenteredContent";
import { OrganizationSelector } from "../OrganizationSelector";

export function NoOrganizationSelected() {
  return (
    <CenteredContent>
      <EmptyState
        icon={<BuildingOfficeIcon />}
        title="No organization selected"
        description="Please select an organization before using this functionality"
        withIndicatorBackground
      >
        <EmptyState.Actions>
          <OrganizationSelector />
        </EmptyState.Actions>
      </EmptyState>
    </CenteredContent>
  );
}
