import { Selector } from "@astryxdesign/core/Selector";
import { BuildingsIcon } from "@phosphor-icons/react";
import { useAtom, useAtomValue } from "jotai";
import { currentOrganizationIdAtom } from "../atoms/currentOrganizationId";
import { organizationSelectorOptionsAtom } from "../atoms/organizationSelectorOptions";

export function OrganizationSelector() {
  const [currentOrganizationId, setCurrentOrganizationId] = useAtom(
    currentOrganizationIdAtom,
  );
  const organizationsOptions = useAtomValue(organizationSelectorOptionsAtom);

  const onSelectOrganization = (selected: string) => {
    setCurrentOrganizationId(selected);
  };

  return (
    <Selector
      label="Organizations"
      isLabelHidden
      startIcon={BuildingsIcon}
      placeholder="Select an organization"
      options={[...organizationsOptions]}
      value={currentOrganizationId ?? undefined}
      onChange={onSelectOrganization}
    />
  );
}
