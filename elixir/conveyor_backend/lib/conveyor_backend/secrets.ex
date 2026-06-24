defmodule ConveyorBackend.Secrets do
  @moduledoc false

  use AshAuthentication.Secret

  def secret_for([:authentication, :tokens, :signing_secret], ConveyorBackend.Accounts.User, _opts, _context) do
    Application.fetch_env(:conveyor_backend, :token_signing_secret)
  end
end
