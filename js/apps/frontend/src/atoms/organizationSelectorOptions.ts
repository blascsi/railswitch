import { atom } from "jotai";

export type OrganizationSelectorOption = {
  label: string;
  value: string;
};

export const organizationSelectorOptionsAtom = atom<
  readonly OrganizationSelectorOption[]
>([]);
