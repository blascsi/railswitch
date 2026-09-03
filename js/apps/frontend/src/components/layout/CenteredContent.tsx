import { Center } from "@astryxdesign/core/Center";
import type { ReactNode } from "react";

type CenteredContentProps = {
  children: ReactNode;
};

/**
 * A page block centred in whatever height it is given — empty states, errors.
 */
export function CenteredContent({ children }: CenteredContentProps) {
  return (
    <Center width="100%" minHeight="100%" padding={4}>
      {children}
    </Center>
  );
}
