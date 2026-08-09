import { Anchor, type AnchorProps, type ElementProps } from "@mantine/core";
import { createLink, type LinkComponent } from "@tanstack/react-router";
import { forwardRef } from "react";

interface MantineAnchorLinkProps
  extends AnchorProps,
    Omit<ElementProps<"a", keyof AnchorProps>, "href"> {}

const MantineAnchorLink = forwardRef<HTMLAnchorElement, MantineAnchorLinkProps>(
  (props, ref) => <Anchor ref={ref} {...props} />,
);

const CreatedLinkAnchor = createLink(MantineAnchorLink);

export const LinkAnchor: LinkComponent<typeof MantineAnchorLink> = (props) => (
  <CreatedLinkAnchor {...props} />
);
