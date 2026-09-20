import { Link, type LinkProps } from "@astryxdesign/core/Link";
import { createLink, type LinkComponent } from "@tanstack/react-router";
import { forwardRef, type ComponentPropsWithoutRef } from "react";

type AstryxAnchorLinkProps = LinkProps &
  Omit<ComponentPropsWithoutRef<"a">, keyof LinkProps>;

const AstryxAnchorLink = forwardRef<HTMLAnchorElement, AstryxAnchorLinkProps>(
  // These links are inline: they sit inside a sentence, a table cell or a
  // supporting line, so they take the surrounding text's size rather than
  // imposing the body size on it. A caller can still pass its own `type`.
  (props, ref) => <Link ref={ref} type="inherit" {...props} />,
);

const CreatedLinkAnchor = createLink(AstryxAnchorLink);

export const LinkAnchor: LinkComponent<typeof AstryxAnchorLink> = (props) => (
  <CreatedLinkAnchor {...props} />
);
