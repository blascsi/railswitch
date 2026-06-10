defmodule ConveyorBackend.Accounts do
  use Ash.Domain,
    otp_app: :conveyor_backend

  resources do
    resource ConveyorBackend.Accounts.Token
    resource ConveyorBackend.Accounts.User
  end
end
