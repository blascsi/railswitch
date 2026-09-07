import { EmptyState } from "@astryxdesign/core/EmptyState";
import { Icon } from "@astryxdesign/core/Icon";
import { BuildingOfficeIcon } from "@phosphor-icons/react";
import { CenteredContent } from "../layout/CenteredContent";
import { OrganizationSelector } from "../OrganizationSelector";

export function OrganizationUnavailable() {
  return (
    <CenteredContent>
      <EmptyState
        icon={<Icon icon={BuildingOfficeIcon} size="lg" />}
        title="Organization unavailable"
        description="It may have been deleted, or you may no longer be a member."
        actions={<OrganizationSelector />}
      />
    </CenteredContent>
  );
}
