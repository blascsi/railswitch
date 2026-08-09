defmodule RailswitchBackendWeb.Plugs.RequireSession do
  @moduledoc """
  Rejects requests whose client claims a session that no longer resolves.

  The browser client sends `x-session: active` only while it believes it is
  signed in. When that header is present but authentication produced no user,
  the session is gone: clear the stale auth cookie and answer `401`, so the
  client can sign out at once instead of receiving the empty results that
  filter policies would otherwise return.

  Requests without the header pass through untouched — including sign-in and
  registration from a signed-out client whose expired cookie is still attached.
  The header is a client-supplied hint for that decision only, never an
  authorization signal: the actor still comes from the verified token.

  Must run *after* `RememberMe`, so a valid remember-me cookie is given the
  chance to re-establish the session first.
  """

  @behaviour Plug

  import Plug.Conn

  alias RailswitchBackendWeb.AuthCookies

  @session_header "x-session"
  @active "active"

  @impl true
  def init(opts), do: opts

  @impl true
  def call(conn, _opts) do
    if claims_session?(conn) and is_nil(conn.assigns[:current_user]) do
      conn
      |> AuthCookies.delete_auth_cookie()
      |> send_resp(:unauthorized, "")
      |> halt()
    else
      conn
    end
  end

  defp claims_session?(conn), do: get_req_header(conn, @session_header) == [@active]
end
