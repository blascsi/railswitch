defmodule RailswitchBackend.Orgs.Membership.Types.Status do
  @moduledoc false
  use Ash.Type.Enum, values: [:declined, :pending, :accepted]

  def graphql_type(_), do: :membership_status
end
