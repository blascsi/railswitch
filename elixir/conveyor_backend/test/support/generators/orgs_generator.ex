defmodule ConveyorBackend.OrgsGenerator do
  @moduledoc """
  `Ash.Generator`-based test data builders for the `ConveyorBackend.Orgs`
  domain.
  """

  use Ash.Generator

  @action_opts [:actor, :tenant, :authorize?, :context, :scope]

  @doc """
  Builds a `:create` changeset for an organization. Requires `:actor` — the
  actor becomes the organization's first owner.
  """
  def organization(opts \\ []) do
    {action_opts, overrides} = Keyword.split(opts, @action_opts)

    changeset_generator(
      ConveyorBackend.Orgs.Organization,
      :create,
      [
        defaults: [name: sequence(:org_name, &"Organization #{&1}")],
        overrides: overrides
      ] ++ Keyword.put_new(action_opts, :authorize?, false)
    )
  end

  @doc """
  Builds a `:create` changeset for a membership. Pass `:organization_id`,
  `:user_id`, and optionally `:role` (defaults to `:member`).
  """
  def membership(opts \\ []) do
    {action_opts, overrides} = Keyword.split(opts, @action_opts)

    changeset_generator(
      ConveyorBackend.Orgs.Membership,
      :create,
      [
        defaults: [role: :member],
        overrides: overrides
      ] ++ Keyword.put_new(action_opts, :authorize?, false)
    )
  end
end
