import { atomWithStorage } from "jotai/utils";

/**
 * The organization last visited, so a signed-in user returning to an
 * organization-free page is offered the one they were working in. The URL is
 * what scopes a request; this only decides where the chrome points.
 */
export const lastOrganizationIdAtom = atomWithStorage<string | null>(
  "lastOrganizationId",
  null,
  undefined,
  { getOnInit: true },
);
