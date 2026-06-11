defmodule ConveyorBackend.Accounts.User.Changes.CreatePersonalOrganization do
  @moduledoc false
  use Ash.Resource.Change

  @impl true
  def init(opts) do
    {:ok, opts}
  end

  @impl true
  def change(changeset, _opts, _context) do
    Ash.Changeset.after_action(changeset, fn _changeset, user ->
      _org =
        ConveyorBackend.Orgs.create_organization!(personal_org_name(user), actor: user)

      {:ok, user}
    end)
  end

  defp personal_org_name(user) do
    user.email
    |> to_string()
    |> String.split("@")
    |> hd()
    |> Kernel.<>("'s organization")
  end
end
