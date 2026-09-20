import { Card } from "@astryxdesign/core/Card";
import { Center } from "@astryxdesign/core/Center";
import { HStack, Stack } from "@astryxdesign/core/Stack";
import { Heading } from "@astryxdesign/core/Text";
import * as stylex from "@stylexjs/stylex";
import type { ReactNode } from "react";

import { AuthHeroPanel } from "./AuthHeroPanel";

const styles = stylex.create({
  formSide: {
    flexGrow: 1,
    minWidth: 0,
  },
});

type AuthLayoutProps = {
  title: string;
  children: ReactNode;
};

export function AuthLayout({ title, children }: AuthLayoutProps) {
  return (
    <HStack minHeight="100dvh">
      <AuthHeroPanel />
      <Center padding={4} xstyle={styles.formSide}>
        <Card padding={8} width="100%" maxWidth={440}>
          <Stack gap={5}>
            <Heading level={1}>{title}</Heading>
            {children}
          </Stack>
        </Card>
      </Center>
    </HStack>
  );
}
