import { Selector } from "@astryxdesign/core/Selector";
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
    void navigate({
      to: "/o/$organizationId",
      params: { organizationId: selected },
    });
  };

  return (
    <Selector
      label="Organizations"
      isLabelHidden
      startIcon="organization"
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
