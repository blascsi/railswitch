defmodule ConveyorBackend.Accounts do
  @moduledoc false

  use Ash.Domain,
    otp_app: :conveyor_backend

  resources do
    resource ConveyorBackend.Accounts.Token
    resource ConveyorBackend.Accounts.User
  end
end
