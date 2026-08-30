import {
  AppShell,
  Avatar,
  Burger,
  Divider,
  Group,
  Menu,
  Text,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  FlagIcon,
  FolderIcon,
  HouseIcon,
  SignOutIcon,
  TerminalIcon,
} from "@phosphor-icons/react";
import { useAtom } from "jotai";
import type { ReactNode } from "react";
import { useMutation } from "urql";
import { currentUserAtom } from "../../atoms/currentUser";
import { graphql } from "../../graphql/graphql";
import { useIsRouteActive } from "../../hooks/useIsRouteActive";
import { OrganizationSelector } from "../OrganizationSelector";
import { NavbarLink } from "../routing/link-components/NavbarLink";

const SignOutMutation = graphql(`
  mutation SignOut {
    signOut
  }
`);

type AppShellLayoutProps = {
  children: ReactNode;
};

export function AppShellLayout({ children }: AppShellLayoutProps) {
  const [opened, { toggle }] = useDisclosure(true);
  const [_, signOut] = useMutation(SignOutMutation);
  const [currentUser, setCurrentUser] = useAtom(currentUserAtom);
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

  const onSignOut = async () => {
    await signOut({});
    setCurrentUser(null);
  };

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
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger opened={opened} onClick={toggle} size="sm" />
            <Divider orientation="vertical" />
          </Group>
          <Group>
            <OrganizationSelector />
            <Divider orientation="vertical" />
            <Menu>
              <Menu.Target>
                <Avatar
                  variant="filled"
                  name={currentUser?.email}
                  styles={{ root: { cursor: "pointer" } }}
                />
              </Menu.Target>

              <Menu.Dropdown>
                <Menu.Label>Signed in as</Menu.Label>
                <Text size="sm" px="sm">
                  {currentUser?.email}
                </Text>
                <Menu.Divider />
                <Menu.Item leftSection={<SignOutIcon />} onClick={onSignOut}>
                  Sign Out
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
        </Group>
      </AppShell.Header>
      <AppShell.Navbar>
        <AppShell.Section grow>
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
      </AppShell.Navbar>
      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
}
