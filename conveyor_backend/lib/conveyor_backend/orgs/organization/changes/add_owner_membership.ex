defmodule ConveyorBackend.Orgs.Organization.Changes.AddOwnerMembership do
  @moduledoc false

  use Ash.Resource.Change

  @impl true
  def init(opts) do
    {:ok, opts}
  end

  @impl true
  def change(changeset, _opts, %{actor: actor}) do
    Ash.Changeset.after_action(changeset, fn _changeset, org ->
      ConveyorBackend.Orgs.add_member!(org.id, actor.id, :owner, authorize?: false)
      {:ok, org}
    end)
  end
end
