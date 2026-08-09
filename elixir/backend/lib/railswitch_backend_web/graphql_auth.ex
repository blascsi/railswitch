defmodule RailswitchBackendWeb.GraphqlAuth do
  @moduledoc """
  Keeps authentication tokens out of GraphQL response bodies, in both
  directions.

  Resolvers cannot touch the `conn`, so both hooks below record what happened
  in the Absinthe context via `modify_resolution`, and `before_send/2` (wired
  up as `Absinthe.Plug`'s `:before_send`) turns that into cookies:

    * `store_tokens/3` — attached to sign-in and register, stashes the tokens
      minted for the resolved user so they can be written as cookies.
    * `mark_signed_out/3` — attached to sign-out, records only that it
      succeeded. `before_send/2` then revokes the tokens the request arrived
      with, reading them from the `conn` rather than the context so no request
      but a sign-out ever carries a raw token around.
  """

  import Plug.Conn

  alias AshAuthentication.TokenResource
  alias RailswitchBackend.Accounts.Token
  alias RailswitchBackend.Accounts.User
  alias RailswitchBackendWeb.AuthCookies

  def store_tokens(resolution, _query, _result) do
    case resolved_value(resolution) do
      %User{__metadata__: metadata} ->
        put_context(resolution, %{
          sign_in_auth_token: Map.get(metadata, :token),
          sign_in_remember_me: Map.get(metadata, :remember_me)
        })

      _other ->
        resolution
    end
  end

  def mark_signed_out(resolution, _query, _result) do
    case resolved_value(resolution) do
      :successful_signout -> put_context(resolution, %{sign_out?: true})
      _other -> resolution
    end
  end

  def before_send(conn, %Absinthe.Blueprint{execution: %{context: %{sign_out?: true}}}) do
    conn = fetch_cookies(conn)

    revoke(bearer_token(conn))
    revoke(conn.req_cookies[AuthCookies.remember_me_cookie_name()])

    conn
    |> AuthCookies.delete_auth_cookie()
    |> AuthCookies.delete_remember_me_cookie()
  end

  def before_send(conn, %Absinthe.Blueprint{execution: %{context: context}}) do
    conn
    |> put_auth_cookie(context[:sign_in_auth_token])
    |> put_remember_me_cookie(context[:sign_in_remember_me])
  end

  def before_send(conn, _blueprint), do: conn

  # A query resolves to the value itself, a mutation to %{result: value}.
  defp resolved_value(%{value: %{result: result}}), do: result
  defp resolved_value(%{value: value}), do: value

  defp put_context(resolution, values), do: %{resolution | context: Map.merge(resolution.context, values)}

  defp bearer_token(conn) do
    case get_req_header(conn, "authorization") do
      ["Bearer " <> token] -> token
      _other -> nil
    end
  end

  defp revoke(token) when is_binary(token), do: TokenResource.Actions.revoke(Token, token)
  defp revoke(_token), do: :ok

  defp put_auth_cookie(conn, token) when is_binary(token), do: AuthCookies.put_auth_cookie(conn, token)

  defp put_auth_cookie(conn, _token), do: conn

  defp put_remember_me_cookie(conn, %{token: token, max_age: max_age}),
    do: AuthCookies.put_remember_me_cookie(conn, token, max_age)

  defp put_remember_me_cookie(conn, _remember_me), do: conn
end
