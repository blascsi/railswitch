defmodule RailswitchBackend.AttributeRegexes do
  @moduledoc """
  A collection of regexes that can be used as constraints for resource attributes
  """

  @lowercase_letters_and_underscores_regex ~r/\A[a-z_]+\z/

  def lowercase_letters_and_underscores do
    @lowercase_letters_and_underscores_regex
  end
end
