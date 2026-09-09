defmodule RailswitchBackend.Flags.FlagEnvironment.Changes.NormalizeAndValidateRules do
  @moduledoc """
  Normalizes the `rules` attribute and validates it against the JSON Schema
  shared with the frontend.

  Both steps live in one change because the order matters: trimming is what
  turns an attribute of only whitespace into the empty string the schema
  rejects.
  """

  use Ash.Resource.Change

  alias RailswitchBackend.Flags.FlagEnvironment.Rules

  @impl true
  def change(changeset, _opts, _context) do
    case Ash.Changeset.fetch_change(changeset, :rules) do
      {:ok, rules} -> normalize_and_validate(changeset, rules)
      :error -> changeset
    end
  end

  defp normalize_and_validate(changeset, rules) do
    normalized = Rules.normalize(rules)

    case Rules.validate(normalized) do
      :ok ->
        Ash.Changeset.force_change_attribute(changeset, :rules, normalized)

      {:error, errors} ->
        Enum.reduce(errors, changeset, fn {message, path}, acc ->
          Ash.Changeset.add_error(acc, field: :rules, message: "#{path}: #{message}")
        end)
    end
  end
end
