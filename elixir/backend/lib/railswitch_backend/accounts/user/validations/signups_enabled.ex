defmodule RailswitchBackend.Accounts.User.Validations.SignupsEnabled do
  @moduledoc """
  Refuses registration while signups are disabled for this instance.
  """

  use Ash.Resource.Validation

  alias Ash.Error.Changes.InvalidChanges
  alias RailswitchBackend.Instance

  @impl true
  def describe(_opts), do: "signups are enabled for this instance"

  @impl true
  def validate(_changeset, _opts, _context) do
    if Instance.current_settings!().signups_enabled do
      :ok
    else
      {:error, InvalidChanges.exception(message: "Signups are disabled on this instance")}
    end
  end
end
