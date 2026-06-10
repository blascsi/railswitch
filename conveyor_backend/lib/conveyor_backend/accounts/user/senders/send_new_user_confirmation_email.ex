defmodule ConveyorBackend.Accounts.User.Senders.SendNewUserConfirmationEmail do
  @moduledoc """
  Sends an email for a new user to confirm their email address.
  """

  use AshAuthentication.Sender
  use ConveyorBackendWeb, :verified_routes

  import Swoosh.Email

  alias ConveyorBackend.Mailer

  @impl true
  def send(user, token, _) do
    new()
    |> from({"noreply", "noreply@conveyor.com"})
    |> to(to_string(user.email))
    |> subject("Confirm your email address")
    |> html_body(body(token: token))
    |> Mailer.deliver!()
  end

  defp body(params) do
    token = params[:token]

    """
    <p>Use this token to confirm your email:</p>
    <p>#{token}</p>
    """
  end
end
