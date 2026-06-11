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
      ConveyorBackend.Orgs.Membership
      |> Ash.Changeset.for_create(
        :create,
        %{
          user_id: actor.id,
          organization_id: org.id,
          role: :owner
        },
        authorize?: false
      )
      |> Ash.create!()

      {:ok, org}
    end)
  end
end
