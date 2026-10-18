defmodule RailswitchBackend.Orgs.Membership.Actions.Invite do
  @moduledoc """
  Generic action to invite an user to an organization.
  The action should return `:ok` regardless of the user existing,
  or already having a membership to the organization, to avoid enumerating
  user emails.
  """

  use Ash.Resource.Actions.Implementation

  alias RailswitchBackend.Accounts
  alias RailswitchBackend.Orgs

  @unique_membership_constraint "memberships_unique_membership_index"

  @impl true
  def run(input, _opts, _context) do
    org_id = input.tenant
    email = Ash.ActionInput.get_argument(input, :email)
    role = Ash.ActionInput.get_argument(input, :role)

    case Accounts.get_user_by_email(email, authorize?: false, not_found_error?: false) do
      {:ok, nil} ->
        :ok

      {:ok, user} ->
        add_pending_member(org_id, user.id, role)

      {:error, error} ->
        {:error, error}
    end
  end

  # If the user already has a membership in the organization, it is left untouched
  # and the invite still succeeds. The inviter must not be able to tell whether the
  # email belongs to a user, or what that user's membership status is.
  defp add_pending_member(org_id, user_id, role) do
    case Orgs.add_member(org_id, user_id, %{role: role, status: :pending},
           authorize?: false,
           tenant: org_id
         ) do
      {:ok, _membership} ->
        :ok

      {:error, error} ->
        if unique_membership_error?(error), do: :ok, else: {:error, error}
    end
  end

  defp unique_membership_error?(%Ash.Error.Invalid{errors: errors}) do
    Enum.any?(errors, &unique_membership_error?/1)
  end

  defp unique_membership_error?(%Ash.Error.Changes.InvalidAttribute{private_vars: vars}) do
    vars[:constraint] == @unique_membership_constraint
  end

  defp unique_membership_error?(_error), do: false
end
