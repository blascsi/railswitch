import { NavigationProgress, nprogress } from "@mantine/nprogress";
import { useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";

const SHOW_DELAY_MS = 150;

export function RouteProgress() {
  const isNavigating = useRouterState({
    select: (state) =>
      state.isLoading || state.matches.some((match) => !!match.isFetching),
  });

  useEffect(() => {
    if (!isNavigating) {
      nprogress.complete();
      return;
    }

    const timer = setTimeout(() => nprogress.start(), SHOW_DELAY_MS);

    return () => clearTimeout(timer);
  }, [isNavigating]);

  return <NavigationProgress />;
}
