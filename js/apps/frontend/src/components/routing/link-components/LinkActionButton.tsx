import { Button, type ButtonProps } from "@astryxdesign/core/Button";
import { createLink, type LinkComponent } from "@tanstack/react-router";
import { forwardRef, type ComponentPropsWithoutRef, type Ref } from "react";

type AstryxActionButtonLinkProps = ButtonProps &
  Omit<ComponentPropsWithoutRef<"a">, keyof ButtonProps>;

const AstryxActionButtonLink = forwardRef<
  HTMLAnchorElement,
  AstryxActionButtonLinkProps
>((props, ref) => (
  <Button ref={ref as Ref<HTMLButtonElement>} isIconOnly {...props} />
));

const CreatedLinkActionButton = createLink(AstryxActionButtonLink);

export const LinkActionButton: LinkComponent<typeof AstryxActionButtonLink> = (
  props,
) => <CreatedLinkActionButton preload="intent" {...props} />;
