defmodule RailswitchBackend.Flags.FlagEnvironment.Defaults do
  @moduledoc """
  Collection of default attributes for a FlagEnvironment
  """

  @rules %{
    "rules" => [
      %{
        "description" => "Example configuration",
        "enabled" => true,
        "conditions" => %{
          "combinator" => "and",
          "conditions" => []
        },
        "result" => %{"type" => "value", "value" => true}
      }
    ]
  }

  @doc """
  The `rules` a flag environment created with by default
  """
  def rules, do: @rules
end
