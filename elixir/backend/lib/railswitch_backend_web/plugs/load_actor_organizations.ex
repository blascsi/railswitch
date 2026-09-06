defmodule RailswitchBackendWeb.Plugs.LoadActorOrganizations do
  @moduledoc """
  Loads the actor's organization ids so the `RailswitchBackend.Orgs.Checks.ActorInTenant`
  check can verify them in-memory. Without this, a GraphQL query that requests multiple
  resources might load the organization for each separate resource that has an
  `ActorInTenant` check.

  Must run *after* `SetTenant`, which is where the organization comes from.
  """

  @behaviour Plug

  @impl true
  def init(opts), do: opts

  @impl true
  def call(conn, _opts) do
    actor = Ash.PlugHelpers.get_actor(conn)

    if is_nil(actor) or is_nil(Ash.PlugHelpers.get_tenant(conn)) do
      conn
    else
      Ash.PlugHelpers.set_actor(conn, Ash.load!(actor, :organization_ids, authorize?: false))
    end
  end
end
