defmodule RailswitchBackend.Instance.Settings.EnvironmentSource do
  @moduledoc """
  Reads the instance settings from the application environment, which
  `config/runtime.exs` fills from environment variables.
  """

  def values do
    :railswitch_backend
    |> Application.fetch_env!(__MODULE__)
    |> Map.new()
  end
end
