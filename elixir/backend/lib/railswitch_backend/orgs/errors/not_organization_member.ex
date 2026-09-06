defmodule RailswitchBackend.Orgs.Errors.NotOrganizationMember do
  @moduledoc """
  Raised when a request names an organization the actor does not belong to.

  Distinct from a plain forbidden so the client can offer a different
  organization instead of an error page.

  The claim model answers three shapes differently:

    * Claiming one — the `x-organization-id` header — gets this error.

    * Naming a record inside the claim is a lookup: `null` from a get-by-id.

    * Asking for your own things — `listOrganizations`, header-less
      `listMemberships` — is filtered.
  """

  use Splode.Error, fields: [:organization_id], class: :forbidden

  def message(%{organization_id: organization_id}) do
    "Actor is not a member of organization #{organization_id}"
  end
end
