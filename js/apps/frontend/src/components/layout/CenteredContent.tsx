import { Center } from "@astryxdesign/core/Center";
import type { ReactNode } from "react";

type CenteredContentProps = {
  minHeight?: string;
  children: ReactNode;
};

export function CenteredContent({
  minHeight = "100%",
  children,
}: CenteredContentProps) {
  return (
    <Center width="100%" minHeight={minHeight} padding={4}>
      {children}
    </Center>
  );
}
