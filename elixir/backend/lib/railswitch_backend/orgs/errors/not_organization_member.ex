defmodule RailswitchBackend.Orgs.Errors.NotOrganizationMember do
  @moduledoc """
  Raised when a request names an organization the actor does not belong to.

  Distinct from a plain forbidden so the client can offer a different
  organization instead of an error page.

  The backend can treat organization ids differently based on where they
  are in the request:

    * Naming an organization via the `x-organization-id` header: gets
      this error returned if the user is not a member.

    * Including an ID in an action acts like a lookup: on reading one resource
      gets `null` returned, on create / update gets `invalid_attribute`.

    * Reading lists of resources are filtered, getting empty lists back.
  """

  use Splode.Error, fields: [:organization_id], class: :forbidden

  def message(%{organization_id: organization_id}) do
    "Actor is not a member of organization #{organization_id}"
  end
end
