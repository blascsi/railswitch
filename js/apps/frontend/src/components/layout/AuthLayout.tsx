import { Center, Paper, Stack, Title } from "@mantine/core";
import type { ReactNode } from "react";

type AuthLayoutProps = {
  title: string;
  children: ReactNode;
};

export function AuthLayout({ title, children }: AuthLayoutProps) {
  return (
    <Center mih="100dvh">
      <Paper withBorder miw={500} py="lg" px="lg">
        <Stack>
          <Title>{title}</Title>
          {children}
        </Stack>
      </Paper>
    </Center>
  );
}
