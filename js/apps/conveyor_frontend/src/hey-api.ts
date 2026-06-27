import type { CreateClientConfig } from "./generated/client/client.gen";

export const createClientConfig: CreateClientConfig = (config) => ({
  ...config,
  baseUrl: import.meta.env.VITE_API_URL ?? "http://localhost:4000/api/json",
  credentials: "include",
  throwOnError: true,
});
