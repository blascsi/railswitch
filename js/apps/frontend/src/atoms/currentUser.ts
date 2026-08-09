import { atomWithStorage } from "jotai/utils";

export type CurrentUser = {
  id: string;
  email: string;
};

/**
 * The signed-in user, persisted so a reload can scope the GraphQL client and
 * render the signed-in layout before the server confirms the session.
 * Optimistic: the server remains the authority, and a 401 from any request
 * clears it.
 */
export const currentUserAtom = atomWithStorage<CurrentUser | null>(
  "currentUser",
  null,
  undefined,
  { getOnInit: true },
);
