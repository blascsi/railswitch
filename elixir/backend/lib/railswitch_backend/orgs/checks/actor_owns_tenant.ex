defmodule RailswitchBackend.Orgs.Checks.ActorOwnsTenant do
  @moduledoc """
  Simple check to see if the Actor is an owner of the 
  tenant the request is scoped for.
  """
  use Ash.Policy.SimpleCheck

  require Ash.Query

  @impl true
  def describe(_opts), do: "actor is an accepted owner of the requested organization"

  @impl true
  def match?(nil, _context, _options) do
    false
  end

  def match?(_actor, %{subject: %{tenant: nil}}, _options) do
    false
  end

  def match?(actor, %{subject: %{tenant: tenant}}, _options) do
    RailswitchBackend.Orgs.Membership
    |> Ash.Query.filter(
      organization_id == ^tenant and user_id == ^actor.id and role == :owner and
        status == :accepted
    )
    |> Ash.exists?(authorize?: false)
  end
end
