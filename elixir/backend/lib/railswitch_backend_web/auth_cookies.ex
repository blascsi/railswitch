defmodule RailswitchBackendWeb.AuthCookies do
  @moduledoc """
  Single source of truth for the two authentication cookies.

    * `"railswitch_token"` — the short-lived session JWT. Deliberately set with
      **no `:max_age`**, so it is a browser-session cookie: it dies when the
      browser closes. That *is* the "remember me unchecked" behaviour.
    * the remember-me cookie — its name and lifetime come from the RememberMe
      strategy DSL (`:railswitch_remember_me`, 30 days).

  Both are HTTP-only and `SameSite=Lax`: JavaScript never sees a token.
  """

  import Plug.Conn

  alias AshAuthentication.Info
  alias RailswitchBackend.Accounts.User

  @auth_cookie "railswitch_token"

  def auth_cookie_name, do: @auth_cookie

  def remember_me_cookie_name do
    User
    |> Info.strategy!(:remember_me)
    |> Map.fetch!(:cookie_name)
    |> to_string()
  end

  def put_auth_cookie(conn, token), do: put_resp_cookie(conn, auth_cookie_name(), token, base_opts())

  def delete_auth_cookie(conn), do: delete_cookie(conn, auth_cookie_name())

  def put_remember_me_cookie(conn, token, max_age),
    do: put_resp_cookie(conn, remember_me_cookie_name(), token, [max_age: max_age] ++ base_opts())

  def delete_remember_me_cookie(conn), do: delete_cookie(conn, remember_me_cookie_name())

  defp delete_cookie(conn, name), do: delete_resp_cookie(conn, name, path: "/")

  defp base_opts do
    [
      http_only: true,
      secure: Application.get_env(:railswitch_backend, :secure_cookies, true),
      same_site: "Lax",
      path: "/"
    ]
  end
end
