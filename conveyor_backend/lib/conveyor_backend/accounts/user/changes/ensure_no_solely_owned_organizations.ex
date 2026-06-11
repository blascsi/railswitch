defmodule ConveyorBackend.Accounts.User.Changes.EnsureNoSolelyOwnedOrganizations do
  @moduledoc """
  Blocks account deletion while the user is the only owner of one or more
  organizations, listing them in the error so the user knows what to delete
  or transfer first. Runs inside the destroy transaction behind a
  `FOR UPDATE` lock on the owner memberships of every org the user owns.
  """

  use Ash.Resource.Change

  alias ConveyorBackend.Orgs.Membership

  require Ash.Query

  @impl true
  def init(opts) do
    {:ok, opts}
  end

  @impl true
  def change(changeset, _opts, _context) do
    Ash.Changeset.before_action(changeset, &check_with_lock/1)
  end

  defp check_with_lock(changeset) do
    user_id = changeset.data.id

    case solely_owned_org_ids(user_id) do
      [] ->
        changeset

      org_ids ->
        Ash.Changeset.add_error(changeset,
          message:
            "you are the only owner of: #{org_names(org_ids)}. Delete these " <>
              "organizations or transfer ownership before deleting your account"
        )
    end
  end

  defp solely_owned_org_ids(user_id) do
    owned_org_ids =
      Membership
      |> Ash.Query.filter(user_id == ^user_id and role == :owner)
      |> Ash.read!(authorize?: false)
      |> Enum.map(& &1.organization_id)

    case owned_org_ids do
      [] ->
        []

      org_ids ->
        Membership
        |> Ash.Query.filter(organization_id in ^org_ids and role == :owner)
        # deterministic lock order avoids deadlocks
        |> Ash.Query.sort(:id)
        |> Ash.Query.lock(:for_update)
        |> Ash.read!(authorize?: false)
        |> Enum.group_by(& &1.organization_id)
        |> Enum.filter(fn {_org_id, owners} ->
          Enum.all?(owners, &(&1.user_id == user_id))
        end)
        |> Enum.map(&elem(&1, 0))
    end
  end

  defp org_names(org_ids) do
    ConveyorBackend.Orgs.Organization
    |> Ash.Query.filter(id in ^org_ids)
    |> Ash.Query.select([:name])
    |> Ash.read!(authorize?: false)
    |> Enum.map(& &1.name)
    |> Enum.sort()
    |> Enum.join(", ")
  end
end
