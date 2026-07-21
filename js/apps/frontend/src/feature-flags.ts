import { setupSdk } from "@railswitch/sdk";

const railswitchUrl =
  import.meta.env.VITE_RAILSWITCH_URL ?? "http://localhost:4000/sdk/socket";
const apiKey = import.meta.env.VITE_RAILSWITCH_API_KEY ?? "";
const environment =
  import.meta.env.VITE_RAILSWITCH_ENVIRONMENT ?? "development";

const { rsx, teardown } = setupSdk(
  { url: railswitchUrl, apiKey, environment },
  {},
);

export { rsx, teardown };
