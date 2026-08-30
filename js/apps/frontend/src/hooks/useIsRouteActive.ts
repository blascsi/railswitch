import {
  type UseMatchRouteOptions,
  useMatchRoute,
  useRouterState,
} from "@tanstack/react-router";

/**
 * Whether any of the given routes matches the current location.
 */
export function useIsRouteActive(targets: readonly UseMatchRouteOptions[]) {
  const matchRoute = useMatchRoute();

  return useRouterState({
    select: () => targets.some((target) => !!matchRoute(target)),
  });
}
