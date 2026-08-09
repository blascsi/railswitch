import { Center } from "@mantine/core";
import type { ReactNode } from "react";

const availableHeight =
  "calc(100dvh - var(--app-shell-header-offset, 0rem) - var(--app-shell-footer-offset, 0rem) - var(--app-shell-padding, 0rem) * 2)";

type CenteredContentProps = {
  children: ReactNode;
};

export function CenteredContent({ children }: CenteredContentProps) {
  return <Center mih={availableHeight}>{children}</Center>;
}
