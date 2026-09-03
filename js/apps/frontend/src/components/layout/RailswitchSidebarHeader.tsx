import { useAppShellMobile } from "@astryxdesign/core/AppShell";
import { Center } from "@astryxdesign/core/Center";
import { useTopNavRenderMode } from "@astryxdesign/core/TopNav";
import * as stylex from "@stylexjs/stylex";
import { RailswitchLogo } from "../brand/RailswitchLogo";

const styles = stylex.create({
  // Sits in the top bar but reads as the head of the side nav column: it
  // carries the rail's tint, spans the rail's width, and closes with the
  // same hairline, so its trailing edge continues the rail's border. The
  // theme strips the bar's padding so this block can run flush into the
  // header's corner and fill the height the bar sets.
  header: {
    width: "var(--railswitch-side-nav-width)",
    height: "var(--railswitch-top-nav-height)",
    paddingInline: "var(--spacing-4)",
    backgroundColor: "var(--color-background-muted)",
    borderInlineEndWidth: "var(--border-width)",
    borderInlineEndStyle: "solid",
    borderInlineEndColor: "var(--color-border)",
  },
  // The mobile bar has no rail beside it to line up with, and it keeps its
  // own padding, so the block drops the column treatment and sits as a
  // plain logo alongside the drawer toggle.
  headerMobile: {
    width: "auto",
    height: "auto",
    // The mobile bar supplies half of the inset itself; the rest is made up
    // here so the mark sits the same distance from the edge in both modes.
    paddingInlineStart: "calc(var(--spacing-4) - var(--spacing-2))",
    paddingInlineEnd: 0,
    backgroundColor: "transparent",
    borderInlineEndWidth: 0,
    borderInlineEndStyle: "none",
  },
});

export function RailswitchSidebarHeader() {
  const { isMobile } = useAppShellMobile();
  const renderMode = useTopNavRenderMode();

  // The mobile drawer takes the top bar's heading as its own header, which
  // would put a second copy of the logo behind the one already in the bar.
  if (renderMode === "drawer") {
    return null;
  }

  return (
    <Center
      axis="vertical"
      xstyle={[styles.header, isMobile && styles.headerMobile]}
    >
      <RailswitchLogo />
    </Center>
  );
}
