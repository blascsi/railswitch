defmodule RailswitchBackend.Instance.Settings.TestSource do
  @moduledoc """
  Instance settings for tests: the configured values, with overrides that only
  apply to the test process that set them (and processes it spawned), so tests
  that change settings can stay async.
  """

  alias RailswitchBackend.Instance.Settings.EnvironmentSource

  @overrides_key {__MODULE__, :overrides}

  def values, do: Map.merge(EnvironmentSource.values(), overrides())

  def put_instance_setting(key, value) do
    Process.put(@overrides_key, Map.put(Process.get(@overrides_key, %{}), key, value))
  end

  defp overrides do
    Enum.find_value([self() | Process.get(:"$callers", [])], %{}, &overrides_of/1)
  end

  defp overrides_of(pid) do
    with {:dictionary, dictionary} <- Process.info(pid, :dictionary),
         {@overrides_key, overrides} <- List.keyfind(dictionary, @overrides_key, 0) do
      overrides
    else
      _ -> nil
    end
  end
end
