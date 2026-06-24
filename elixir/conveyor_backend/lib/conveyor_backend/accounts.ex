defmodule ConveyorBackend.Accounts do
  @moduledoc false

  use Ash.Domain,
    otp_app: :conveyor_backend,
    extensions: [AshJsonApi.Domain]

  alias ConveyorBackend.Accounts.User

  json_api do
    routes do
      base_route "/users", User do
        post :register_with_password do
          route "/register"
          metadata &remember_me_metadata/3
        end

        post :sign_in_with_password do
          route "/sign-in"
          metadata &remember_me_metadata/3
        end

        get :current_user, route: "/me"
        delete :destroy
      end
    end
  end

  resources do
    resource ConveyorBackend.Accounts.Token

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

  defp remember_me_metadata(_subject, user, _request) do
    meta = %{token: user.__metadata__.token}

    case Map.get(user.__metadata__, :remember_me) do
      nil -> meta
      rm -> Map.put(meta, :remember_me, rm)
    end
  end
end
