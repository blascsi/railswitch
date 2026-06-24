defmodule ConveyorBackendWeb.Plugs.TokensToCookies do
  @moduledoc """
  Lifts AshAuthentication tokens out of JSON:API auth responses into cookies.

  Auth routes (sign-in / register / remember-me sign-in) put tokens in the
  JSON:API `meta` object. In a `before_send` hook this plug:

  1. writes the session JWT to the HTTP-only auth cookie,
  2. writes the remember-me token (if any) to its own HTTP-only cookie,
  3. strips both from the response body so they never reach JavaScript.

  For every non-auth response the hook is a no-op.
  """
  @behaviour Plug

  import Plug.Conn

  alias ConveyorBackendWeb.AuthCookies

  @impl true
  def init(opts), do: opts

  @impl true
  def call(conn, _opts), do: register_before_send(conn, &lift_tokens/1)

  defp lift_tokens(%Plug.Conn{status: status} = conn) when status in 200..299 do
    with [ct | _] <- get_resp_header(conn, "content-type"),
         true <- String.starts_with?(ct, "application/vnd.api+json"),
         {:ok, %{"meta" => meta} = body} <- Jason.decode(conn.resp_body),
         true <- (is_map(meta) and is_map_key(meta, "token")) or is_map_key(meta, "remember_me") do
      conn
      |> store_auth_token(meta["token"])
      |> store_remember_me(meta["remember_me"])
      |> strip(body, meta)
    else
      _ -> conn
    end
  end

  defp lift_tokens(conn), do: conn

  defp store_auth_token(conn, token) when is_binary(token), do: AuthCookies.put_auth_cookie(conn, token)

  defp store_auth_token(conn, _), do: conn

  defp store_remember_me(conn, %{"cookie_name" => name, "token" => token, "max_age" => max_age}),
    do: AuthCookies.put_remember_me_cookie(conn, name, token, max_age)

  defp store_remember_me(conn, _), do: conn

  defp strip(conn, body, meta) do
    meta = Map.drop(meta, ["token", "remember_me"])

    body = if meta == %{}, do: Map.delete(body, "meta"), else: Map.put(body, "meta", meta)

    %{conn | resp_body: Jason.encode!(body)}
  end
end
