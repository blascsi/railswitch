defmodule RailswitchBackendWeb.AuthFlowTest do
  @moduledoc """
  End-to-end authentication tests through the JSON:API.
  """
  use RailswitchBackendWeb.ConnCase, async: true
  use Ash.Generator

  alias RailswitchBackend.Accounts
  alias RailswitchBackend.AccountsGenerator
  alias RailswitchBackend.Orgs.Membership
  alias RailswitchBackend.Orgs.Organization

  require Ash.Query

  @auth_cookie "railswitch_token"
  @remember_cookie "railswitch_remember_me"

  describe "POST /users/register" do
    test "registers, sets the auth cookie, and strips the token from the body", %{conn: conn} do
      conn =
        post(
          with_json_api_headers(conn),
          "/api/json/users/register",
          register_body("reg@example.com")
        )

      assert conn.status == 201
      assert is_binary(auth_cookie_value(conn))

      body = Jason.decode!(conn.resp_body)
      assert body["data"]["attributes"]["email"] == "reg@example.com"
      # The JWT must never reach the client through the response body.
      assert body["meta"] in [nil, %{}]
      refute conn.resp_body =~ "\"token\""
    end

    test "sets a remember-me cookie when remember_me is requested", %{conn: conn} do
      conn =
        post(
          with_json_api_headers(conn),
          "/api/json/users/register",
          register_body("rememberme@example.com", remember_me: true)
        )

      assert conn.status == 201
      assert is_binary(conn.resp_cookies[@remember_cookie][:value])
      assert conn.resp_cookies[@remember_cookie][:max_age] == 2_592_000
    end
  end

  describe "POST /users/sign-in" do
    test "signs in an existing user and sets the auth cookie", %{conn: conn} do
      email = "si@example.com"
      password = "password1234"
      generate(AccountsGenerator.user(email: email, password: password))

      conn =
        post(
          with_json_api_headers(conn),
          "/api/json/users/sign-in",
          signin_body(email, password)
        )

      assert conn.status == 201
      assert is_binary(auth_cookie_value(conn))
      refute conn.resp_body =~ "\"token\""
    end

    test "rejects an invalid password", %{conn: conn} do
      email = "si2@example.com"
      generate(AccountsGenerator.user(email: email, password: "password1234"))

      conn =
        post(
          with_json_api_headers(conn),
          "/api/json/users/sign-in",
          signin_body(email, "wrongpassword")
        )

      # A generic 401 (see lib/railswitch_backend_web/ash_json_api_errors.ex) that
      # doesn't reveal whether the email or the password was wrong.
      assert conn.status == 401

      assert Jason.decode!(conn.resp_body)["errors"] |> hd() |> Map.get("code") ==
               "authentication_failed"

      assert is_nil(auth_cookie_value(conn))
    end
  end

  describe "GET /users/me" do
    test "returns the current user when the auth cookie is present", %{conn: conn} do
      email = "me@example.com"
      user = generate(AccountsGenerator.user(email: email))

      conn =
        conn
        |> with_json_api_headers()
        |> put_req_header("cookie", "#{@auth_cookie}=#{user.__metadata__.token}")
        |> get("/api/json/users/me")

      assert conn.status == 200
      assert Jason.decode!(conn.resp_body)["data"]["attributes"]["email"] == email
    end

    test "works with a bearer token for non-browser clients", %{conn: conn} do
      email = "bearer@example.com"
      user = generate(AccountsGenerator.user(email: email))

      conn =
        conn
        |> with_json_api_headers()
        |> put_req_header("authorization", "Bearer #{user.__metadata__.token}")
        |> get("/api/json/users/me")

      assert conn.status == 200
      assert Jason.decode!(conn.resp_body)["data"]["attributes"]["email"] == email
    end

    test "does not return a user without authentication", %{conn: conn} do
      generate(AccountsGenerator.user(email: "wontsee@example.com"))
      conn = get(with_json_api_headers(conn), "/api/json/users/me")

      # `current_user` is a get-action filtered to the actor, so with no actor it
      # resolves to nothing → 404 rather than a hard 403.
      assert conn.status == 404
      refute conn.resp_body =~ "@example.com"
    end
  end

  describe "DELETE /users/:id" do
    test "a user can delete their own account once they own no organizations", %{conn: conn} do
      email = "del@example.com"
      user = generate(AccountsGenerator.user(email: email))
      drop_personal_org(user)

      conn =
        conn
        |> with_json_api_headers()
        |> put_req_header("cookie", "#{@auth_cookie}=#{user.__metadata__.token}")
        |> delete("/api/json/users/#{user.id}")

      assert conn.status in [200, 204]
      assert {:error, _} = Accounts.sign_in_user(email, "password1234")
    end

    test "deletion is blocked while the user solely owns an organization", %{conn: conn} do
      email = "delblocked@example.com"
      user = generate(AccountsGenerator.user(email: email))

      conn =
        conn
        |> with_json_api_headers()
        |> put_req_header("cookie", "#{@auth_cookie}=#{user.__metadata__.token}")
        |> delete("/api/json/users/#{user.id}")

      assert conn.status >= 400
      assert conn.resp_body =~ "only owner"
      assert {:ok, _} = Accounts.sign_in_user(email, "password1234")
    end
  end

  describe "remember-me re-login" do
    test "a stale session is re-established from the remember-me cookie", %{conn: conn} do
      email = "relogin@example.com"
      user = generate(AccountsGenerator.user(email: email, remember_me: true))
      remember_token = user.__metadata__.remember_me.token

      # No auth cookie — only the remember-me cookie, as if the browser session
      # cookie had expired. The RememberMe plug should silently re-authenticate.
      conn =
        conn
        |> with_json_api_headers()
        |> put_req_header("cookie", "#{@remember_cookie}=#{remember_token}")
        |> get("/api/json/users/me")

      assert conn.status == 200
      assert Jason.decode!(conn.resp_body)["data"]["attributes"]["email"] == email
      # A fresh session cookie should have been minted by the plug.
      assert is_binary(auth_cookie_value(conn))
    end
  end

  defp with_json_api_headers(conn) do
    conn
    |> put_req_header("content-type", "application/vnd.api+json")
    |> put_req_header("accept", "application/vnd.api+json")
  end

  defp register_body(email, opts \\ []) do
    password = "password1234"

    attrs =
      Map.merge(
        %{
          "email" => email,
          "password" => password,
          "password_confirmation" => password
        },
        Map.new(opts, fn {k, v} -> {to_string(k), v} end)
      )

    Jason.encode!(%{"data" => %{"type" => "user", "attributes" => attrs}})
  end

  defp signin_body(email, password) do
    Jason.encode!(%{
      "data" => %{"type" => "user", "attributes" => %{"email" => email, "password" => password}}
    })
  end

  defp auth_cookie_value(conn), do: conn.resp_cookies[@auth_cookie][:value]

  # Removes the organization the user solely owns (their personal org), so the
  # account-deletion guard no longer blocks deletion.
  defp drop_personal_org(user) do
    org_ids =
      Membership
      |> Ash.Query.filter(user_id == ^user.id)
      |> Ash.read!(authorize?: false)
      |> Enum.map(& &1.organization_id)

    Organization
    |> Ash.Query.filter(id in ^org_ids)
    |> Ash.read!(authorize?: false)
    |> Enum.each(&Ash.destroy!(&1, authorize?: false))
  end
end
