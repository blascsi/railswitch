/** biome-ignore-all lint/suspicious/noExplicitAny: This file is supposed to provide a wrapper over React's `lazy`, which has any in it's type already. */

import { type ComponentType, type LazyExoticComponent, lazy } from "react";

type Factory<T extends ComponentType<any>> = () => Promise<{ default: T }>;

export type PreloadableComponent<T extends ComponentType<any>> =
  LazyExoticComponent<T> & { preload: Factory<T> };

export function lazyWithPreload<T extends ComponentType<any>>(
  factory: Factory<T>,
): PreloadableComponent<T> {
  const Component = lazy(factory) as PreloadableComponent<T>;
  Component.preload = factory;
  return Component;
}
