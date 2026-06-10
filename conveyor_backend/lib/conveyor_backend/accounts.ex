defmodule ConveyorBackend.Accounts do
  @moduledoc false

  use Ash.Domain,
    otp_app: :conveyor_backend

  resources do
    resource ConveyorBackend.Accounts.Token

    resource ConveyorBackend.Accounts.User do
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
    end
  end
end
