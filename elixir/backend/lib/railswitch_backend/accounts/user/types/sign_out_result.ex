defmodule RailswitchBackend.Accounts.User.Types.SignOutResult do
  @moduledoc false
  use Ash.Type.Enum, values: [:successful_signout]

  def graphql_type(_), do: :sign_out_result
end
