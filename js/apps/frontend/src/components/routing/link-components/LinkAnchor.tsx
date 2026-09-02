import { Link, type LinkProps } from "@astryxdesign/core/Link";
import { createLink, type LinkComponent } from "@tanstack/react-router";
import { type ComponentPropsWithoutRef, forwardRef } from "react";

type AstryxAnchorLinkProps = LinkProps &
  Omit<ComponentPropsWithoutRef<"a">, keyof LinkProps>;

const AstryxAnchorLink = forwardRef<HTMLAnchorElement, AstryxAnchorLinkProps>(
  (props, ref) => <Link ref={ref} {...props} />,
);

const CreatedLinkAnchor = createLink(AstryxAnchorLink);

export const LinkAnchor: LinkComponent<typeof AstryxAnchorLink> = (props) => (
  <CreatedLinkAnchor {...props} />
);
