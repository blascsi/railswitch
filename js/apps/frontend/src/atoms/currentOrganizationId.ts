import { atomWithStorage } from "jotai/utils";

export const currentOrganizationIdAtom = atomWithStorage<string | null>(
  "currentOrganizationId",
  null,
  undefined,
  { getOnInit: true },
);
