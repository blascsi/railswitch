defmodule RailswitchBackend.Accounts.User.Senders.SendPasswordResetEmail do
  @moduledoc """
  Sends a password reset email
  """

  use AshAuthentication.Sender
  use RailswitchBackendWeb, :verified_routes

  import Swoosh.Email

  alias RailswitchBackend.Mailer

  @impl true
  def send(user, token, _) do
    new()
    |> from({"noreply", "noreply.com"})
    |> to(to_string(user.email))
    |> subject("Reset your password")
    |> html_body(body(token: token))
    |> Mailer.deliver!()
  end

  defp body(params) do
    token = params[:token]

    """
    <p>Use this token to reset your password:</p>
    <p>#{token}</p>
    """
  end
end
