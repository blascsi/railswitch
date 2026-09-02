import { SideNavItem, type SideNavItemProps } from "@astryxdesign/core/SideNav";
import { createLink, type LinkComponent } from "@tanstack/react-router";
import { type ComponentPropsWithoutRef, forwardRef } from "react";

type AstryxNavItemProps = SideNavItemProps &
  Omit<ComponentPropsWithoutRef<"a">, keyof SideNavItemProps>;

const AstryxNavItem = forwardRef<HTMLAnchorElement, AstryxNavItemProps>(
  (props, ref) => <SideNavItem ref={ref} {...props} />,
);

const LinkNavItem = createLink(AstryxNavItem);

export const NavbarLink: LinkComponent<typeof AstryxNavItem> = (props) => {
  return <LinkNavItem activeOptions={{ exact: false }} {...props} />;
};
