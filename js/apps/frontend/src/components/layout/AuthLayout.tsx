import { Card } from "@astryxdesign/core/Card";
import { Stack } from "@astryxdesign/core/Stack";
import { Heading } from "@astryxdesign/core/Text";
import type { ReactNode } from "react";
import { CenteredContent } from "./CenteredContent";

type AuthLayoutProps = {
  title: string;
  children: ReactNode;
};

export function AuthLayout({ title, children }: AuthLayoutProps) {
  return (
    <CenteredContent minHeight="100dvh">
      <Card width="min(100%, 500px)">
        <Stack gap={4} padding={5}>
          <Heading level={1}>{title}</Heading>
          {children}
        </Stack>
      </Card>
    </CenteredContent>
  );
}
