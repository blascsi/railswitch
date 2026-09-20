import { HStack, VStack } from "@astryxdesign/core/Stack";
import { Heading, Text } from "@astryxdesign/core/Text";
import { Theme } from "@astryxdesign/core/theme";
import * as stylex from "@stylexjs/stylex";

import { railswitchTheme } from "../../themes/railswitch/railswitchTheme";
import { RailswitchGlyph } from "../brand/RailswitchGlyph";

const styles = stylex.create({
  // The panel is decoration: it never takes more than a fraction of the
  // page, so the form is always at least its equal, and it drops out once
  // the viewport can no longer hold both at a usable width.
  panel: {
    position: "relative",
    width: "min(560px, 40%)",
    flexShrink: 0,
    overflow: "hidden",
    backgroundColor: "var(--color-background-card)",
    display: {
      default: "block",
      "@media (max-width: 960px)": "none",
    },
  },
  art: {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
  },
  content: {
    position: "relative",
  },
});

// The panel is a dark surface inside a light page, so it renders under the
// theme's dark scheme: the accent becomes the lime the artwork is drawn in,
// and the ink stops come out on the right side of that surface without a
// second set of hardcoded colours.
export function AuthHeroPanel() {
  return (
    <Theme theme={railswitchTheme} mode="dark">
      <div {...stylex.props(styles.panel)}>
        <svg
          viewBox="0 0 560 900"
          preserveAspectRatio="xMidYMid slice"
          fill="none"
          aria-hidden="true"
          {...stylex.props(styles.art)}
        >
          <g stroke="var(--color-border-emphasized)" strokeWidth="1">
            <path d="M-40 300h640M-40 360h640M-40 420h640M-40 480h640M-40 540h640M-40 600h640" />
          </g>
          <g
            stroke="var(--color-accent)"
            strokeWidth="2.5"
            strokeLinecap="round"
            opacity="0.85"
          >
            <path d="M-40 480h240" />
            <path d="M200 480C320 480 320 360 440 360H600" />
          </g>
          <circle cx="200" cy="480" r="6" fill="var(--color-accent)" />
        </svg>
        <VStack
          justify="between"
          height="100%"
          paddingBlock={8}
          paddingInline={6}
          xstyle={styles.content}
        >
          <HStack vAlign="center" gap={3}>
            <RailswitchGlyph />
            <Heading level={3}>Railswitch</Heading>
          </HStack>
          <VStack gap={3} maxWidth={380}>
            <Heading level={2} textWrap="nowrap">
              One request in, two routes out.
            </Heading>
            <Text type="supporting" color="secondary">
              Feature flags with rules you can read, versioned per environment.
            </Text>
          </VStack>
        </VStack>
      </div>
    </Theme>
  );
}
