import { AppShell, Burger, Group } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { FolderIcon, HouseIcon } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { SignOutButton } from "../auth/SignOutButton";
import { OrganizationSelector } from "../OrganizationSelector";
import { NavbarLink } from "../routing/NavbarLink";

type AppShellLayoutProps = {
  children: ReactNode;
};

export function AppShellLayout({ children }: AppShellLayoutProps) {
  const [opened, { toggle }] = useDisclosure(true);

  return (
    <AppShell
      layout="alt"
      header={{ height: 60 }}
      navbar={{
        width: 300,
        breakpoint: "md",
        collapsed: { mobile: !opened, desktop: !opened },
      }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md">
          <Burger opened={opened} onClick={toggle} size="sm" />
        </Group>
      </AppShell.Header>
      <AppShell.Navbar>
        <AppShell.Section grow>
          <Group m="md">
            <OrganizationSelector w="100%" />
          </Group>
          <NavbarLink to="/home" label="Home" leftSection={<HouseIcon />} />
          <NavbarLink
            to="/projects"
            label="Projects"
            leftSection={<FolderIcon />}
          />
        </AppShell.Section>
        <AppShell.Section>
          <SignOutButton />
        </AppShell.Section>
      </AppShell.Navbar>
      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
}
