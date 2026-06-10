defmodule ConveyorBackendWeb.Plugs.AuthCookieToBearer do
  @moduledoc """
  Copies the auth cookie into the `Authorization: Bearer` header, so the rest
  of the pipeline is the standard AshAuthentication bearer flow.

  A real `Authorization` header sent by the client (mobile app, script, API
  consumer) always takes precedence — the cookie is only a fallback for
  browsers, which can't be trusted to attach headers but attach cookies
  automatically.
  """

  @behaviour Plug

  import Plug.Conn

  alias ConveyorBackendWeb.AuthCookies

  @impl true
  def init(opts), do: opts

  @impl true
  def call(conn, _opts) do
    conn = fetch_cookies(conn)

    case {get_req_header(conn, "authorization"), conn.req_cookies[AuthCookies.auth_cookie_name()]} do
      {[], token} when is_binary(token) ->
        put_req_header(conn, "authorization", "Bearer " <> token)

      _ ->
        conn
    end
  end
end
