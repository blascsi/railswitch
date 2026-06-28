import { type DefaultParams, Redirect, Route, type RouteProps } from "wouter";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { PageLoader } from "./PageLoader";

type Allow = "authenticated" | "unauthenticated";

type GuardedRouteProps = RouteProps & {
  allow: Allow;
  redirectTo: string;
};

function GuardedRoute({
  component: Component,
  allow,
  redirectTo,
  ...rest
}: GuardedRouteProps) {
  return (
    <Route {...rest}>
      {(params) => (
        <Guard
          component={Component}
          params={params}
          allow={allow}
          redirectTo={redirectTo}
        />
      )}
    </Route>
  );
}

function Guard({
  component: Component,
  params,
  allow,
  redirectTo,
}: {
  component: RouteProps["component"];
  params: DefaultParams;
  allow: Allow;
  redirectTo: string;
}) {
  const { isPending, isSuccess } = useCurrentUser();

  if (isPending) {
    return <PageLoader />;
  }

  const allowed = allow === "authenticated" ? isSuccess : !isSuccess;

  if (!allowed) {
    return <Redirect to={redirectTo} />;
  }

  return Component ? <Component params={params} /> : null;
}

export function AuthenticatedRoute(props: RouteProps) {
  return <GuardedRoute {...props} allow="authenticated" redirectTo="/" />;
}

export function UnauthenticatedRoute(props: RouteProps) {
  return <GuardedRoute {...props} allow="unauthenticated" redirectTo="/home" />;
}
