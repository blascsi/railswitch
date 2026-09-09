import { EmptyState } from "@astryxdesign/core/EmptyState";
import { AppIcon } from "../AppIcon";
import { CenteredContent } from "../layout/CenteredContent";
import { LinkButton } from "./link-components/LinkButton";

export function NotFoundPage() {
  return (
    <CenteredContent>
      <EmptyState
        icon={<AppIcon icon="notFound" size="lg" />}
        title="Page not found"
        description="The page you are looking for does not exist, or it may have been moved"
        actions={<LinkButton to="/home" label="Go to home" />}
      />
    </CenteredContent>
  );
}
