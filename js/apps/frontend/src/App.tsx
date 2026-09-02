import "./App.css";

import { Theme } from "@astryxdesign/core/theme";
import { RouterProvider } from "@tanstack/react-router";
import { Provider as JoiaiProvider } from "jotai";
import { GraphqlProvider } from "./graphql/GraphqlProvider";
import { router } from "./router";
import { store } from "./store.ts";
import { railswitchTheme } from "./theme.ts";

export function App() {
  return (
    <JoiaiProvider store={store}>
      <GraphqlProvider>
        <Theme theme={railswitchTheme} mode="dark">
          <RouterProvider router={router} />
        </Theme>
      </GraphqlProvider>
    </JoiaiProvider>
  );
}
