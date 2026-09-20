import { Button, type ButtonProps } from "@astryxdesign/core/Button";
import { createLink, type LinkComponent } from "@tanstack/react-router";
import { forwardRef, type ComponentPropsWithoutRef, type Ref } from "react";

type AstryxButtonLinkProps = ButtonProps &
  Omit<ComponentPropsWithoutRef<"a">, keyof ButtonProps>;

const AstryxButtonLink = forwardRef<HTMLAnchorElement, AstryxButtonLinkProps>(
  (props, ref) => <Button ref={ref as Ref<HTMLButtonElement>} {...props} />,
);

const CreatedLinkButton = createLink(AstryxButtonLink);

export const LinkButton: LinkComponent<typeof AstryxButtonLink> = (props) => (
  <CreatedLinkButton {...props} />
);
