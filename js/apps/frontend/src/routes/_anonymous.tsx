import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { currentUserAtom } from "../atoms/currentUser";
import { store } from "../store";

export const Route = createFileRoute("/_anonymous")({
  beforeLoad: () => {
    if (store.get(currentUserAtom) != null) {
      throw redirect({ to: "/home" });
    }
  },
  component: Outlet,
});
