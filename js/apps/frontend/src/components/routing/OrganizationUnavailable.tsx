import { EmptyState } from "@astryxdesign/core/EmptyState";

import { AppIcon } from "../AppIcon";
import { CenteredContent } from "../layout/CenteredContent";
import { OrganizationSelector } from "../OrganizationSelector";

export function OrganizationUnavailable() {
  return (
    <CenteredContent>
      <EmptyState
        icon={<AppIcon icon="organization" size="lg" />}
        title="Organization unavailable"
        description="It may have been deleted, or you may no longer be a member."
        actions={<OrganizationSelector />}
      />
    </CenteredContent>
  );
}
