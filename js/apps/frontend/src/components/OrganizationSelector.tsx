import { Selector } from "@astryxdesign/core/Selector";
import { BuildingsIcon } from "@phosphor-icons/react";
import { getRouteApi, useNavigate } from "@tanstack/react-router";

const authenticatedRoute = getRouteApi("/_authenticated");

type OrganizationSelectorProps = {
  organizationId?: string | null;
};

export function OrganizationSelector({
  organizationId,
}: OrganizationSelectorProps) {
  const navigate = useNavigate();
  const organizations = authenticatedRoute.useLoaderData();

  const onSelectOrganization = (selected: string) => {
    navigate({
      to: "/o/$organizationId",
      params: { organizationId: selected },
    });
  };

  return (
    <Selector
      label="Organizations"
      isLabelHidden
      startIcon={BuildingsIcon}
      placeholder="Select an organization"
      options={organizations.map((organization) => ({
        label: organization.name,
        value: organization.id,
      }))}
      value={organizationId ?? undefined}
      onChange={onSelectOrganization}
    />
  );
}
