defmodule RailswitchBackend.Secrets do
  @moduledoc false

  use AshAuthentication.Secret

  def secret_for([:authentication, :tokens, :signing_secret], RailswitchBackend.Accounts.User, _opts, _context) do
    Application.fetch_env(:railswitch_backend, :token_signing_secret)
  end
end
