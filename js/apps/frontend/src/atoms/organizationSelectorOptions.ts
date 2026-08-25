import { atom } from "jotai";
import { organizationsAtom } from "./organizations";

export type OrganizationSelectorOption = {
  label: string;
  value: string;
};

export const organizationSelectorOptionsAtom = atom<
  readonly OrganizationSelectorOption[]
>((get) =>
  (get(organizationsAtom) ?? []).map((organization) => ({
    label: organization.name,
    value: organization.id,
  })),
);
