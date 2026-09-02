import { AppShell } from "@astryxdesign/core/AppShell";
import { Avatar } from "@astryxdesign/core/Avatar";
import { Divider } from "@astryxdesign/core/Divider";
import {
  DropdownMenu,
  DropdownMenuDivider,
  DropdownMenuItem,
} from "@astryxdesign/core/DropdownMenu";
import { Layout, LayoutContent } from "@astryxdesign/core/Layout";
import { SideNav } from "@astryxdesign/core/SideNav";
import { Stack } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";
import { TopNav } from "@astryxdesign/core/TopNav";
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
      contentPadding={0}
      topNav={
        <TopNav
          label="Top navigation"
          endContent={
            <Stack direction="horizontal" gap={2} vAlign="center">
              <OrganizationSelector />
              <Divider orientation="vertical" />
              <DropdownMenu
                hasChevron={false}
                alignment="end"
                button={{
                  label: currentUser?.email ?? "Account",
                  variant: "ghost",
                  isIconOnly: true,
                  icon: (
                    <Avatar
                      name={currentUser?.email}
                      size="sm"
                      shape="square"
                      tooltip={false}
                    />
                  ),
                }}
              >
                <Stack gap={0} paddingInline={2} paddingBlock={1}>
                  <Text type="supporting">Signed in as</Text>
                  <Text>{currentUser?.email}</Text>
                </Stack>
                <DropdownMenuDivider />
                <DropdownMenuItem
                  icon={SignOutIcon}
                  label="Sign Out"
                  onClick={onSignOut}
                />
              </DropdownMenu>
            </Stack>
          }
        />
      }
      sideNav={
        <SideNav aria-label="Main navigation" collapsible>
          <NavbarLink
            to="/home"
            label="Home"
            icon={HouseIcon}
            isSelected={isHomeActive}
          />
          <NavbarLink
            to="/projects"
            label="Projects"
            icon={FolderIcon}
            isSelected={isProjectsActive}
          />
          <NavbarLink
            to="/environments"
            label="Environments"
            icon={TerminalIcon}
            isSelected={isEnvironmentsActive}
          />
          <NavbarLink
            to="/flags"
            label="Flags"
            icon={FlagIcon}
            isSelected={isFlagsActive}
          />
        </SideNav>
      }
    >
      <Layout
        contentWidth={960}
        padding={6}
        content={<LayoutContent>{children}</LayoutContent>}
      />
    </AppShell>
  );
}
