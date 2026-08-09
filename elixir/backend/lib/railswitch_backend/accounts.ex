defmodule RailswitchBackend.Accounts do
  @moduledoc false

  use Ash.Domain, otp_app: :railswitch_backend, extensions: [AshGraphql.Domain]

  alias RailswitchBackend.Accounts.User
  alias RailswitchBackendWeb.GraphqlAuth

  graphql do
    queries do
      read_one User, :current_user, :current_user

      # Sign-in is a read action, but it mints a token (a side effect), so it
      # is exposed as a mutation. GraphqlAuth moves the token into cookies.
      read_one User, :sign_in, :sign_in_with_password do
        as_mutation? true
        modify_resolution {GraphqlAuth, :store_tokens, []}
      end
    end

    mutations do
      create User, :register, :register_with_password do
        modify_resolution {GraphqlAuth, :store_tokens, []}
      end

      action User, :sign_out, :sign_out do
        modify_resolution {GraphqlAuth, :mark_signed_out, []}
      end

      destroy User, :delete_user, :destroy
    end
  end

  resources do
    resource RailswitchBackend.Accounts.Token

    resource User do
      define :register_user,
        action: :register_with_password,
        args: [:email, :password, :password_confirmation]

      define :sign_in_user,
        action: :sign_in_with_password,
        args: [:email, :password]

      define :get_current_user, action: :current_user
      define :get_user_by_id, action: :read, get_by: [:id]

      define :change_password,
        action: :change_password,
        args: [:current_password, :password, :password_confirmation]

      define :delete_user, action: :destroy
    end
  end
end
