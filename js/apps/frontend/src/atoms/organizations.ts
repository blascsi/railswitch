import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { currentOrganizationIdAtom } from "./currentOrganizationId";

export type Organization = {
  id: string;
  name: string;
};

export const organizationsAtom = atomWithStorage<
  readonly Organization[] | null
>("organizations", null, undefined, { getOnInit: true });

export const setOrganizationsAtom = atom(
  null,
  (get, set, organizations: readonly Organization[]) => {
    set(organizationsAtom, organizations);

    const selectedId = get(currentOrganizationIdAtom);
    if (!organizations.some((organization) => organization.id === selectedId)) {
      set(currentOrganizationIdAtom, organizations[0]?.id ?? null);
    }
  },
);
