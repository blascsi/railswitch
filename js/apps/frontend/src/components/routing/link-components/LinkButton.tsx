import { Button, type ButtonProps, type ElementProps } from "@mantine/core";
import { createLink, type LinkComponent } from "@tanstack/react-router";
import { forwardRef } from "react";

interface MantineButtonLinkProps
  extends ButtonProps,
    Omit<ElementProps<"a", keyof ButtonProps>, "href"> {}

const MantineButtonLink = forwardRef<HTMLAnchorElement, MantineButtonLinkProps>(
  (props, ref) => <Button component="a" ref={ref} {...props} />,
);

const CreatedLinkButton = createLink(MantineButtonLink);

export const LinkButton: LinkComponent<typeof MantineButtonLink> = (props) => (
  <CreatedLinkButton {...props} />
);
