import { NavLink, type NavLinkProps } from "@mantine/core";
import { createLink, type LinkComponent } from "@tanstack/react-router";
import { type ComponentPropsWithoutRef, forwardRef } from "react";

type MantineNavLinkProps = NavLinkProps &
  Omit<ComponentPropsWithoutRef<"a">, keyof NavLinkProps>;

const MantineNavLink = forwardRef<HTMLAnchorElement, MantineNavLinkProps>(
  (props, ref) => <NavLink ref={ref} {...props} />,
);

const LinkNavLink = createLink(MantineNavLink);

export const NavbarLink: LinkComponent<typeof MantineNavLink> = (props) => {
  return <LinkNavLink activeOptions={{ exact: false }} {...props} />;
};
