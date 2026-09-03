import { Center } from "@astryxdesign/core/Center";
import * as stylex from "@stylexjs/stylex";

const styles = stylex.create({
  mark: {
    flexShrink: 0,
    backgroundColor: "var(--color-accent)",
  },
});

/**
 * The Railswitch logo, with an accent background color
 */
export function RailswitchMark() {
  return (
    <Center width={32} height={32} xstyle={styles.mark}>
      <svg
        viewBox="0 0 32 32"
        width="21"
        height="21"
        fill="none"
        stroke="var(--color-on-accent)"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M3 23h26" />
        <path d="M11 23c9 0 9-14 18-14" />
        <circle
          cx="11"
          cy="23"
          r="2.8"
          fill="var(--color-on-accent)"
          stroke="none"
        />
      </svg>
    </Center>
  );
}
