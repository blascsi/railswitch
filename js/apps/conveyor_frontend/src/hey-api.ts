import type { CreateClientConfig } from "./generated/client/client.gen";

export const createClientConfig: CreateClientConfig = (config) => ({
  ...config,
  baseUrl: import.meta.env.VITE_API_URL,
  throwOnError: true,
});
