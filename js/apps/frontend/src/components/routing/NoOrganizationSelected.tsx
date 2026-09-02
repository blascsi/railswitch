import { EmptyState } from "@astryxdesign/core/EmptyState";
import { Icon } from "@astryxdesign/core/Icon";
import { BuildingOfficeIcon } from "@phosphor-icons/react";
import { CenteredContent } from "../layout/CenteredContent";
import { OrganizationSelector } from "../OrganizationSelector";

export function NoOrganizationSelected() {
  return (
    <CenteredContent>
      <EmptyState
        icon={<Icon icon={BuildingOfficeIcon} size="lg" />}
        title="No organization selected"
        description="Please select an organization before using this functionality"
        actions={<OrganizationSelector />}
      />
    </CenteredContent>
  );
}
