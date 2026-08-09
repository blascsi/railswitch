import {
  ActionIcon,
  type ActionIconProps,
  type ElementProps,
} from "@mantine/core";
import { createLink, type LinkComponent } from "@tanstack/react-router";
import { forwardRef } from "react";

interface MantineActionIconLinkProps
  extends ActionIconProps,
    Omit<ElementProps<"a", keyof ActionIconProps>, "href"> {}

const MantineActionIconLink = forwardRef<
  HTMLAnchorElement,
  MantineActionIconLinkProps
>((props, ref) => <ActionIcon component="a" ref={ref} {...props} />);

const CreatedLinkActionButton = createLink(MantineActionIconLink);

export const LinkActionButton: LinkComponent<typeof MantineActionIconLink> = (
  props,
) => <CreatedLinkActionButton preload="intent" {...props} />;
