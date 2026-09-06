import { AppShell } from "@astryxdesign/core/AppShell";
import { Avatar } from "@astryxdesign/core/Avatar";
import { Divider } from "@astryxdesign/core/Divider";
import {
  DropdownMenu,
  DropdownMenuDivider,
  DropdownMenuItem,
} from "@astryxdesign/core/DropdownMenu";
import { Layout, LayoutContent } from "@astryxdesign/core/Layout";
import { SideNav, SideNavItem } from "@astryxdesign/core/SideNav";
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
import { getRouteApi } from "@tanstack/react-router";
import { useAtomValue } from "jotai";
import type { ReactNode } from "react";
import { useMutation } from "urql";
import { currentUserAtom } from "../../atoms/currentUser";
import { lastOrganizationIdAtom } from "../../atoms/lastOrganizationId";
import { clearSession } from "../../auth/clearSession";
import { graphql } from "../../graphql/graphql";
import { useIsRouteActive } from "../../hooks/useIsRouteActive";
import { OrganizationSelector } from "../OrganizationSelector";
import { NavbarLink } from "../routing/link-components/NavbarLink";
import { RailswitchSidebarHeader } from "./RailswitchSidebarHeader";

const authenticatedRoute = getRouteApi("/_authenticated");

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
  const currentUser = useAtomValue(currentUserAtom);
  const organizations = authenticatedRoute.useLoaderData();
  const lastOrganizationId = useAtomValue(lastOrganizationIdAtom);
  // This layout sits above the organization param, so it picks one itself.
  const organization =
    organizations.find(({ id }) => id === lastOrganizationId) ??
    organizations[0];
  const organizationParams = organization
    ? { organizationId: organization.id }
    : null;

  const isHomeActive = useIsRouteActive([{ to: "/home" }]);
  const isProjectsActive = useIsRouteActive(
    organizationParams == null
      ? []
      : [
          {
            to: "/o/$organizationId/projects",
            params: organizationParams,
            fuzzy: true,
          },
          {
            to: "/o/$organizationId/project/$projectName",
            params: organizationParams,
          },
        ],
  );
  const isEnvironmentsActive = useIsRouteActive(
    organizationParams == null
      ? []
      : [
          {
            to: "/o/$organizationId/environments",
            params: organizationParams,
            fuzzy: true,
          },
          {
            to: "/o/$organizationId/project/$projectName/environment/$environmentName",
            params: organizationParams,
          },
        ],
  );
  const isFlagsActive = useIsRouteActive(
    organizationParams == null
      ? []
      : [
          {
            to: "/o/$organizationId/flags",
            params: organizationParams,
            fuzzy: true,
          },
          {
            to: "/o/$organizationId/project/$projectName/flag/$flagName",
            params: organizationParams,
          },
        ],
  );

  const onSignOut = async () => {
    await signOut({});
    clearSession();
  };

  return (
    <AppShell
      contentPadding={0}
      variant="wash"
      topNav={
        <TopNav
          label="Top navigation"
          heading={<RailswitchSidebarHeader />}
          endContent={
            <Stack direction="horizontal" gap={2} vAlign="center">
              <OrganizationSelector organizationId={organization?.id} />
              <Divider orientation="vertical" />
              <DropdownMenu
                alignment="end"
                menuWidth={250}
                hasChevron={false}
                button={{
                  label: currentUser?.email ?? "Account",
                  variant: "ghost",
                  isIconOnly: true,
                  icon: (
                    <Avatar
                      name={currentUser?.email}
                      size={32}
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
          {organizationParams == null ? (
            <>
              <SideNavItem label="Projects" icon={FolderIcon} isDisabled />
              <SideNavItem
                label="Environments"
                icon={TerminalIcon}
                isDisabled
              />
              <SideNavItem label="Flags" icon={FlagIcon} isDisabled />
            </>
          ) : (
            <>
              <NavbarLink
                to="/o/$organizationId/projects"
                params={organizationParams}
                label="Projects"
                icon={FolderIcon}
                isSelected={isProjectsActive}
              />
              <NavbarLink
                to="/o/$organizationId/environments"
                params={organizationParams}
                label="Environments"
                icon={TerminalIcon}
                isSelected={isEnvironmentsActive}
              />
              <NavbarLink
                to="/o/$organizationId/flags"
                params={organizationParams}
                label="Flags"
                icon={FlagIcon}
                isSelected={isFlagsActive}
              />
            </>
          )}
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
