import "@mantine/core/styles.css";
import "./App.css";

import { MantineProvider } from "@mantine/core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Suspense } from "react";
import { Switch } from "wouter";
import {
  AuthenticatedRoute,
  UnauthenticatedRoute,
} from "./components/GuardedRoute";
import { PageErrorBoundary } from "./components/PageErrorBoundary";
import { PageLoader } from "./components/PageLoader";
import type { Errors } from "./generated/client";
import { lazyWithPreload } from "./utils/lazy-with-preload";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: (failureCount, error) => {
        const status = Number(
          (error as unknown as Errors)?.errors?.[0]?.status,
        );
        if (status >= 400 && status < 500) {
          return false;
        }
        return failureCount < 2;
      },
    },
  },
});

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
              <UnauthenticatedRoute path="/" component={AuthenticationPage} />
              <AuthenticatedRoute path="/home" component={HomePage} />
            </Switch>
          </Suspense>
        </PageErrorBoundary>
      </MantineProvider>
    </QueryClientProvider>
  );
}
