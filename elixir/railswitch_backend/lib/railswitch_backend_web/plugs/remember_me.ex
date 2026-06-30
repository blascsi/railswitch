defmodule RailswitchBackendWeb.Plugs.RememberMe do
  @moduledoc """
  Maintains authentication from the remember-me cookie.

    * **Silent re-login** — if the request carries no valid session JWT (the
      auth cookie died with the browser, or the JWT inside it expired), sign
      the user in from the remember-me token and set a fresh auth cookie.
    * **Rotation** — if the remember-me token is inside `:refresh_within`
      (default: 7 days) of its expiry, run the sign-in with
      `rotate_token: true` to also mint a fresh remember-me token, replace
      the cookie, and revoke the old token — whether or not the session JWT
      was still valid.

  Must run *after* `retrieve_from_bearer` (it checks `assigns.current_user`
  to know whether a re-login is needed) and *before* `set_actor`.
  """

  @behaviour Plug

  import Plug.Conn

  alias AshAuthentication.Info
  alias AshAuthentication.Jwt
  alias RailswitchBackend.Accounts.Token
  alias RailswitchBackend.Accounts.User
  alias RailswitchBackendWeb.AuthCookies

  require Logger

  @impl true
  def init(opts), do: Keyword.put_new(opts, :refresh_within, {7, :days})

  @impl true
  def call(conn, opts) do
    strategy = Info.strategy!(User, :remember_me)
    cookie_name = to_string(strategy.cookie_name)
    conn = fetch_cookies(conn)

    with token when is_binary(token) <- conn.req_cookies[cookie_name],
         {:ok, %{"exp" => exp}} <- Jwt.peek(token),
         rotate? = close_to_expiry?(exp, opts[:refresh_within]),
         true <- rotate? or is_nil(conn.assigns[:current_user]),
         {:ok, user} <- sign_in_from_token(strategy, token, rotate?) do
      conn
      |> assign(:current_user, user)
      |> AuthCookies.put_auth_cookie(user.__metadata__.token)
      |> maybe_rotate(user, token, rotate?)
    else
      {:error, _} ->
        # The token was rejected (revoked / expired / forged): drop the stale
        # cookie so we don't re-attempt the sign-in on every request.
        AuthCookies.delete_cookie(conn, cookie_name)

      _ ->
        # No cookie, or signed in and nothing to rotate — nothing to do.
        conn
    end
  end

  # The remember-me strategy has no `Strategy.action/4` of its own, so sign-in
  # runs its `sign_in_action_name` read action directly. Passing `rotate_token`
  # lets the action mint a fresh remember-me token in the result metadata.
  defp sign_in_from_token(strategy, token, rotate?) do
    User
    |> Ash.Query.for_read(strategy.sign_in_action_name, %{token: token, rotate_token: rotate?})
    |> Ash.read_one()
  end

  defp close_to_expiry?(exp, {n, unit}) do
    exp - System.os_time(:second) < to_seconds(n, unit)
  end

  defp to_seconds(n, :days), do: n * 86_400
  defp to_seconds(n, :hours), do: n * 3_600
  defp to_seconds(n, :minutes), do: n * 60

  defp maybe_rotate(conn, _user, _old_token, false), do: conn

  defp maybe_rotate(conn, user, old_token, true) do
    %{"cookie_name" => name, "token" => new_token, "max_age" => max_age} =
      user.__metadata__.remember_me

    with {:error, reason} <- AshAuthentication.TokenResource.Actions.revoke(Token, old_token, []) do
      Logger.warning("Failed to revoke rotated remember-me token: #{inspect(reason)}")
    end

    AuthCookies.put_remember_me_cookie(conn, name, new_token, max_age)
  end
end
