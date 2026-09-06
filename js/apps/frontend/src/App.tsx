import "./App.css";

import { Theme } from "@astryxdesign/core/theme";
import { RouterProvider } from "@tanstack/react-router";
import { Provider as JoiaiProvider } from "jotai";
import { router } from "./router";
import { store } from "./store.ts";
import { railswitchTheme } from "./themes/railswitch/railswitchTheme.ts";

export function App() {
  return (
    <JoiaiProvider store={store}>
      <Theme theme={railswitchTheme} mode="light">
        <RouterProvider router={router} />
      </Theme>
    </JoiaiProvider>
  );
}
