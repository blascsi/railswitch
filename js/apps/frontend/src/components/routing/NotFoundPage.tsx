import { EmptyState } from "@astryxdesign/core/EmptyState";
import { Icon } from "@astryxdesign/core/Icon";
import { CompassIcon } from "@phosphor-icons/react";
import { CenteredContent } from "../layout/CenteredContent";
import { LinkButton } from "./link-components/LinkButton";

export function NotFoundPage() {
  return (
    <CenteredContent>
      <EmptyState
        icon={<Icon icon={CompassIcon} size="lg" />}
        title="Page not found"
        description="The page you are looking for does not exist, or it may have been moved"
        actions={<LinkButton to="/home" label="Go to home" />}
      />
    </CenteredContent>
  );
}
