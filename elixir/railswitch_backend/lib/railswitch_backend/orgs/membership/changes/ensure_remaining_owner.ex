defmodule RailswitchBackend.Orgs.Membership.Changes.EnsureRemainingOwner do
  @moduledoc """
  Prevents an organization from losing its last owner — whether the owner is
  leaving (destroy) or being demoted (role change).

  Runs as a `before_action` inside the transaction, behind a `FOR UPDATE`
  lock on the org's owner memberships, so concurrent departures can't race
  past the check.
  """

  use Ash.Resource.Change

  require Ash.Query

  @impl true
  def init(opts) do
    {:ok, opts}
  end

  @impl true
  def change(changeset, _opts, _context) do
    if losing_owner?(changeset) do
      Ash.Changeset.before_action(changeset, &check_with_lock/1)
    else
      changeset
    end
  end

  defp losing_owner?(%{action_type: :destroy, data: %{role: :owner}}), do: true

  defp losing_owner?(%{action_type: :update, data: %{role: :owner}} = changeset),
    do: Ash.Changeset.get_attribute(changeset, :role) != :owner

  defp losing_owner?(_changeset), do: false

  defp check_with_lock(changeset) do
    membership = changeset.data

    owners =
      RailswitchBackend.Orgs.Membership
      |> Ash.Query.filter(organization_id == ^membership.organization_id and role == :owner)
      # deterministic lock order avoids deadlocks
      |> Ash.Query.sort(:id)
      |> Ash.Query.lock(:for_update)
      |> Ash.read!(authorize?: false)

    if Enum.any?(owners, &(&1.id != membership.id)) do
      changeset
    else
      Ash.Changeset.add_error(changeset,
        field: :role,
        message:
          "this organization must keep at least one owner — " <>
            "transfer ownership or delete the organization first"
      )
    end
  end
end
