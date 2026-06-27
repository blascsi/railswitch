import "@mantine/core/styles.css";
import "./App.css";

import { MantineProvider } from "@mantine/core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Suspense } from "react";
import { Route, Switch } from "wouter";
import { PageErrorBoundary } from "./components/PageErrorBoundary";
import { PageLoader } from "./components/PageLoader";
import { lazyWithPreload } from "./utils/lazy-with-preload";

const queryClient = new QueryClient();

const AuthenticationPage = lazyWithPreload(
  () => import("./pages/Authentication.page"),
);

const HomePage = lazyWithPreload(() => import("./pages/Home.page"));

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <MantineProvider defaultColorScheme="auto">
        <PageErrorBoundary>
          <Suspense fallback={<PageLoader />}>
            <Switch>
              <Route path="/" component={AuthenticationPage} />
              <Route path="/home" component={HomePage} />
            </Switch>
          </Suspense>
        </PageErrorBoundary>
      </MantineProvider>
    </QueryClientProvider>
  );
}
