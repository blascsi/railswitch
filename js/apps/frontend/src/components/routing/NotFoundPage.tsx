import { EmptyState } from "@mantine/core";
import { CompassIcon } from "@phosphor-icons/react";
import { CenteredContent } from "../layout/CenteredContent";
import { LinkButton } from "./link-components/LinkButton";

export function NotFoundPage() {
  return (
    <CenteredContent>
      <EmptyState
        icon={<CompassIcon />}
        title="Page not found"
        description="The page you are looking for does not exist, or it may have been moved"
      >
        <EmptyState.Actions>
          <LinkButton to="/home">Go to home</LinkButton>
        </EmptyState.Actions>
      </EmptyState>
    </CenteredContent>
  );
}
