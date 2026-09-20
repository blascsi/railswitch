import { HStack } from "@astryxdesign/core/Stack";
import * as stylex from "@stylexjs/stylex";

import { RailswitchMark } from "./RailswitchMark";

const styles = stylex.create({
  wordmark: {
    fontFamily: "var(--font-family-heading)",
    fontSize: 19,
    fontWeight: 700,
    letterSpacing: "-0.02em",
    color: "var(--color-text-primary)",
  },
});

/** The boxed mark and the wordmark, as one lockup. */
export function RailswitchLogo() {
  return (
    <HStack vAlign="center" gap={3}>
      <RailswitchMark />
      <span {...stylex.props(styles.wordmark)}>Railswitch</span>
    </HStack>
  );
}
