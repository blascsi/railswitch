import "@mantine/core/styles.css";
import "./App.css";

import { MantineProvider } from "@mantine/core";
import { Suspense } from "react";
import { Route, Switch } from "wouter";
import { PageErrorBoundary } from "./components/PageErrorBoundary";
import { PageLoader } from "./components/PageLoader";
import { lazyWithPreload } from "./utils/lazy-with-preload";

const AuthenticationPage = lazyWithPreload(
  () => import("./pages/Authentication.page"),
);

export function App() {
  return (
    <MantineProvider defaultColorScheme="auto">
      <PageErrorBoundary>
        <Suspense fallback={<PageLoader />}>
          <Switch>
            <Route path="/" component={AuthenticationPage} />
          </Switch>
        </Suspense>
      </PageErrorBoundary>
    </MantineProvider>
  );
}
