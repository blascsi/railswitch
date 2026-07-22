defmodule RailswitchBackend.Validations.LowercaseLettersAndUnderscoresAttribute do
  @moduledoc """
  A validation that ensures that provided attributes only contain lowercase letters and
  underscores. Usable to enforce a naming convention for strings that the user might need
  to include in their code / configuration.
  """
  use Ash.Resource.Validation

  @lowercase_letters_and_underscores_regex ~r/\A[a-z_]+\z/

  @impl true
  def init(opts) do
    if opts[:field] != nil && is_atom(opts[:field]) do
      {:ok, opts}
    else
      {:error, "no field provided to LowercaseLettersAndUnderscoresAttribute validation!"}
    end
  end

  @impl true
  def validate(changeset, opts, _context) do
    value = Ash.Changeset.get_attribute(changeset, opts[:field])

    if is_nil(value) || Regex.match?(@lowercase_letters_and_underscores_regex, value) do
      :ok
    else
      {:error, field: opts[:field], message: "must contain only lowercase letters and underscores"}
    end
  end
end
