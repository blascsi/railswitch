defmodule RailswitchBackend.FlagsGenerator do
  @moduledoc """
  `Ash.Generator`-based test data builders for the `RailswitchBackend.Flags`
  domain.
  """

  use Ash.Generator

  @action_opts [:actor, :tenant, :authorize?, :context, :scope]

  @doc """
  Builds a `:create` changeset for a project. Requires `:tenant` (the
  organization id).
  """
  def project(opts \\ []) do
    {action_opts, overrides} = Keyword.split(opts, @action_opts)

    changeset_generator(
      RailswitchBackend.Flags.Project,
      :create,
      [
        defaults: [name: sequence(:project_name, &"Project #{&1}")],
        overrides: overrides
      ] ++ Keyword.put_new(action_opts, :authorize?, false)
    )
  end

  @doc """
  Builds a `:create` changeset for an environment. Requires `:tenant` and a
  `:project_id` override.
  """
  def environment(opts \\ []) do
    {action_opts, overrides} = Keyword.split(opts, @action_opts)

    changeset_generator(
      RailswitchBackend.Flags.Environment,
      :create,
      [
        defaults: [name: sequence(:environment_name, fn n -> "env_" <> letter_suffix(n) end)],
        overrides: overrides
      ] ++ Keyword.put_new(action_opts, :authorize?, false)
    )
  end

  @doc """
  Builds a `:create` changeset for a flag. Requires `:tenant` and a
  `:project_id` override.
  """
  def flag(opts \\ []) do
    {action_opts, overrides} = Keyword.split(opts, @action_opts)

    changeset_generator(
      RailswitchBackend.Flags.Flag,
      :create,
      [
        defaults: [name: sequence(:flag_name, fn n -> "flag_" <> letter_suffix(n) end)],
        overrides: overrides
      ] ++ Keyword.put_new(action_opts, :authorize?, false)
    )
  end

  @doc """
  Builds a `:create` changeset for a project API key. Requires `:tenant` and a
  `:project_id` override. The plaintext key is available on the generated
  record as `record.__metadata__.plaintext_api_key`.
  """
  def api_key(opts \\ []) do
    {action_opts, overrides} = Keyword.split(opts, @action_opts)

    changeset_generator(
      RailswitchBackend.Flags.ProjectApiKey,
      :create,
      [overrides: overrides] ++ Keyword.put_new(action_opts, :authorize?, false)
    )
  end

  # Flag and environment names must satisfy the lowercase-letters-and-
  # underscores validation, so sequence numbers are mapped digit-by-digit to
  # letters (0 -> "a", ..., 9 -> "j").
  defp letter_suffix(n), do: n |> Integer.digits() |> Enum.map_join(fn d -> <<?a + d>> end)
end
