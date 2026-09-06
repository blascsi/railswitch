defmodule RailswitchBackend.Orgs.Checks.ActorInTenant do
  @moduledoc """
  Whether the actor is a member of the organization the request acts in.

  Ash normally hides rows you may not read, so a request naming an organization
  the actor has left comes back empty — which looks just like an organization
  with nothing in it. This check returns an error instead, conveying this information
  to the clients.

  `SetTenant` does no verification, so the claim is checked here.
  """

  use Ash.Policy.SimpleCheck

  alias RailswitchBackend.Orgs.Errors.NotOrganizationMember
  alias RailswitchBackend.Orgs.Membership

  require Ash.Query

  @impl true
  def describe(_opts), do: "actor is a member of the requested organization"

  # Without a tenant there is no claim to check. Actions that require one fail
  # with Ash's own `TenantRequired`, which says so precisely.
  @impl true
  def match?(_actor, %{subject: %{tenant: nil}}, _opts), do: true

  def match?(actor, %{subject: %{tenant: tenant}}, _opts) do
    if member?(actor, tenant) do
      true
    else
      {:error, NotOrganizationMember.exception(organization_id: tenant)}
    end
  end

  defp member?(nil, _tenant), do: false

  defp member?(actor, tenant) do
    Membership
    |> Ash.Query.filter(organization_id == ^tenant and user_id == ^actor.id)
    |> Ash.exists?(authorize?: false)
  end
end
