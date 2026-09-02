import { ProgressBar } from "@astryxdesign/core/ProgressBar";
import * as stylex from "@stylexjs/stylex";
import { useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";

const SHOW_DELAY_MS = 150;

const styles = stylex.create({
  bar: {
    insetBlockStart: 0,
    insetInline: 0,
    position: "fixed",
    zIndex: 1000,
  },
});

export function RouteProgress() {
  const isNavigating = useRouterState({
    select: (state) =>
      state.isLoading || state.matches.some((match) => !!match.isFetching),
  });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!isNavigating) {
      setIsVisible(false);
      return;
    }

    const timer = setTimeout(() => setIsVisible(true), SHOW_DELAY_MS);

    return () => clearTimeout(timer);
  }, [isNavigating]);

  if (!isVisible) {
    return null;
  }

  return (
    <ProgressBar
      label="Loading page"
      isLabelHidden
      isIndeterminate
      xstyle={styles.bar}
    />
  );
}
