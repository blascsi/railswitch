defmodule ConveyorBackend.AccountsGenerator do
  @moduledoc """
  `Ash.Generator`-based test data builders for the `ConveyorBackend.Accounts`
  domain.
  """

  use Ash.Generator

  @password "password1234"

  def valid_user_password, do: @password

  @doc """
  Builds a registration changeset for `:register_with_password`.

  Registration also creates the user's personal organization, so every
  generated user already solely owns one organization.

  Action options (`:actor`, `:tenant`, `:authorize?`, `:context`, `:scope`) may
  be passed alongside attribute overrides; everything else is treated as an
  override of the email/password inputs.
  """
  def user(opts \\ []) do
    {action_opts, overrides} =
      Keyword.split(opts, [:actor, :tenant, :authorize?, :context, :scope])

    password = Keyword.get(overrides, :password, @password)

    changeset_generator(
      ConveyorBackend.Accounts.User,
      :register_with_password,
      [
        defaults: [
          email: sequence(:user_email, &"user#{&1}@example.com"),
          password: password,
          password_confirmation: password
        ],
        overrides: overrides
      ] ++ Keyword.put_new(action_opts, :authorize?, false)
    )
  end
end
