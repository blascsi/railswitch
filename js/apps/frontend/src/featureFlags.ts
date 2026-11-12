import { setupSdk } from "@railswitch/sdk";

import { AppEnvironment } from "./environment";

const { rsx, teardown } = setupSdk(
  {
    url: AppEnvironment.FRONTEND_RAILSWITCH_URL,
    apiKey: AppEnvironment.FRONTEND_RAILSWITCH_API_KEY,
  },
  {},
);

export { rsx, teardown };
