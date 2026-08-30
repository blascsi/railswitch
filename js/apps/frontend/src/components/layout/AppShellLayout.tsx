import { AppShell, Burger, Group } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  FlagIcon,
  FolderIcon,
  HouseIcon,
  TerminalIcon,
} from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { useIsRouteActive } from "../../hooks/useIsRouteActive";
import { SignOutButton } from "../auth/SignOutButton";
import { OrganizationSelector } from "../OrganizationSelector";
import { NavbarLink } from "../routing/link-components/NavbarLink";

type AppShellLayoutProps = {
  children: ReactNode;
};

export function AppShellLayout({ children }: AppShellLayoutProps) {
  const [opened, { toggle }] = useDisclosure(true);
  const isHomeActive = useIsRouteActive([{ to: "/home" }]);
  const isProjectsActive = useIsRouteActive([
    { to: "/projects", fuzzy: true },
    { to: "/project/$projectName" },
  ]);
  const isEnvironmentsActive = useIsRouteActive([
    { to: "/environments", fuzzy: true },
    { to: "/project/$projectName/environment/$environmentName" },
  ]);
  const isFlagsActive = useIsRouteActive([
    { to: "/flags", fuzzy: true },
    { to: "/project/$projectName/flag/$flagName" },
  ]);

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
          <NavbarLink
            to="/home"
            label="Home"
            leftSection={<HouseIcon />}
            active={isHomeActive}
          />
          <NavbarLink
            to="/projects"
            label="Projects"
            leftSection={<FolderIcon />}
            active={isProjectsActive}
          />
          <NavbarLink
            to="/environments"
            label="Environments"
            leftSection={<TerminalIcon />}
            active={isEnvironmentsActive}
          />
          <NavbarLink
            to="/flags"
            label="Flags"
            leftSection={<FlagIcon />}
            active={isFlagsActive}
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
