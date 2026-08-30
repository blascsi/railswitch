import { type MantineStyleProps, Select } from "@mantine/core";
import { useAtom, useAtomValue } from "jotai";
import { currentOrganizationIdAtom } from "../atoms/currentOrganizationId";
import { organizationSelectorOptionsAtom } from "../atoms/organizationSelectorOptions";

type OrganizationSelectorProps = MantineStyleProps;

export function OrganizationSelector(props: OrganizationSelectorProps) {
  const [currentOrganizationId, setCurrentOrganizationId] = useAtom(
    currentOrganizationIdAtom,
  );
  const organizationsOptions = useAtomValue(organizationSelectorOptionsAtom);

  const onSelectOrganization = (selected: string | null) => {
    setCurrentOrganizationId(selected);
  };

  return (
    <Select
      aria-label="Organizations"
      placeholder="Select an organization"
      data={organizationsOptions}
      value={currentOrganizationId}
      onChange={onSelectOrganization}
      checkIconPosition="right"
      allowDeselect={false}
      // Setting `withinPortal: false` because otherwise the portaled
      // dropdown wouldn't be cleaned up while the app reloads with
      // the new Org, and the FullPageLoader is visible
      comboboxProps={{ withinPortal: false }}
      {...props}
    />
  );
}
