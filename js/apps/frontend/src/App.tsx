import "@mantine/core/styles.css";
import "./App.css";

import { MantineProvider } from "@mantine/core";
import { RouterProvider } from "@tanstack/react-router";
import { Provider as JoiaiProvider } from "jotai";
import { GraphqlProvider } from "./graphql/GraphqlProvider";
import { router } from "./router";
import { store } from "./store.ts";

export function App() {
  return (
    <JoiaiProvider store={store}>
      <GraphqlProvider>
        <MantineProvider defaultColorScheme="auto">
          <RouterProvider router={router} />
        </MantineProvider>
      </GraphqlProvider>
    </JoiaiProvider>
  );
}
