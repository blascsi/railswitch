import { EmptyState } from "@astryxdesign/core/EmptyState";
import { Icon } from "@astryxdesign/core/Icon";
import { BuildingOfficeIcon } from "@phosphor-icons/react";
import { useSetAtom } from "jotai";
import { useEffect } from "react";
import { lastOrganizationIdAtom } from "../../atoms/lastOrganizationId";
import { CenteredContent } from "../layout/CenteredContent";
import { OrganizationSelector } from "../OrganizationSelector";

export function OrganizationUnavailable() {
  const setLastOrganizationId = useSetAtom(lastOrganizationIdAtom);

  // Reaching this page means the remembered organization is one the server will
  // not serve, so stop the chrome pointing back at it.
  useEffect(() => {
    setLastOrganizationId(null);
  }, [setLastOrganizationId]);

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
