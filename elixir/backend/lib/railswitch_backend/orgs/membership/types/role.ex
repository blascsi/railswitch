defmodule RailswitchBackend.Orgs.Membership.Types.Role do
  @moduledoc false
  use Ash.Type.Enum, values: [:owner, :member]

  def graphql_type(_), do: :membership_role
end
