defmodule RailswitchBackendWeb.AuthFlowTest do
  @moduledoc """
  End-to-end authentication tests through the GraphQL API.
  """
  use RailswitchBackendWeb.ConnCase, async: true
  use Ash.Generator

  alias AshAuthentication.TokenResource
  alias RailswitchBackend.Accounts
  alias RailswitchBackend.Accounts.Token
  alias RailswitchBackend.AccountsGenerator
  alias RailswitchBackend.Orgs.Membership
  alias RailswitchBackend.Orgs.Organization
  alias RailswitchBackendWeb.Plugs.RememberMe

  require Ash.Query

  @auth_cookie "railswitch_token"
  @remember_cookie "railswitch_remember_me"

  @register_mutation """
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      result { id email }
      errors { code message }
    }
  }
  """

  @sign_in_mutation """
  mutation SignIn($email: String!, $password: String!, $rememberMe: Boolean) {
    signIn(email: $email, password: $password, rememberMe: $rememberMe) {
      id
      email
    }
  }
  """

  @sign_out_mutation """
  mutation {
    signOut
  }
  """

  @current_user_query """
  query {
    currentUser { id email }
  }
  """

  @delete_user_mutation """
  mutation DeleteUser($id: ID!) {
    deleteUser(id: $id) {
      result { id }
      errors { code message }
    }
  }
  """

  describe "register mutation" do
    test "registers, sets the auth cookie, and keeps the token out of the body", %{conn: conn} do
      conn = gql(conn, @register_mutation, %{"input" => register_input("reg@example.com")})

      assert %{"data" => %{"register" => %{"result" => result, "errors" => []}}} = json(conn)
      assert result["email"] == "reg@example.com"
      assert is_binary(auth_cookie_value(conn))
      # The JWT must never reach the client through the response body.
      refute conn.resp_body =~ "token"
    end

    test "sets a remember-me cookie when rememberMe is requested", %{conn: conn} do
      input = Map.put(register_input("rememberme@example.com"), "rememberMe", true)
      conn = gql(conn, @register_mutation, %{"input" => input})

      assert %{"data" => %{"register" => %{"errors" => []}}} = json(conn)
      assert is_binary(conn.resp_cookies[@remember_cookie][:value])
      assert conn.resp_cookies[@remember_cookie][:max_age] == 2_592_000
    end
  end

  describe "signIn mutation" do
    test "signs in an existing user and sets the auth cookie", %{conn: conn} do
      email = "si@example.com"
      password = "password1234"
      generate(AccountsGenerator.user(email: email, password: password))

      conn = gql(conn, @sign_in_mutation, %{"email" => email, "password" => password})

      assert %{"data" => %{"signIn" => %{"email" => ^email}}} = json(conn)
      assert is_binary(auth_cookie_value(conn))
      refute conn.resp_body =~ "token"
    end

    test "rejects an invalid password", %{conn: conn} do
      email = "si2@example.com"
      generate(AccountsGenerator.user(email: email, password: "password1234"))

      conn = gql(conn, @sign_in_mutation, %{"email" => email, "password" => "wrongpassword"})

      # A generic error that doesn't reveal whether the email or the password
      # was wrong.
      assert %{"data" => %{"signIn" => nil}, "errors" => errors} = json(conn)
      assert Enum.any?(errors, &(&1["extensions"]["code"] == "authentication_failed"))
      assert is_nil(auth_cookie_value(conn))
    end
  end

  describe "currentUser query" do
    test "returns the current user when the auth cookie is present", %{conn: conn} do
      email = "me@example.com"
      user = generate(AccountsGenerator.user(email: email))

      conn =
        conn
        |> put_req_header("cookie", "#{@auth_cookie}=#{user.__metadata__.token}")
        |> gql(@current_user_query)

      assert %{"data" => %{"currentUser" => %{"email" => ^email}}} = json(conn)
    end

    test "works with a bearer token for non-browser clients", %{conn: conn} do
      email = "bearer@example.com"
      user = generate(AccountsGenerator.user(email: email))

      conn =
        conn
        |> put_req_header("authorization", "Bearer #{user.__metadata__.token}")
        |> gql(@current_user_query)

      assert %{"data" => %{"currentUser" => %{"email" => ^email}}} = json(conn)
    end

    test "does not return a user without authentication", %{conn: conn} do
      generate(AccountsGenerator.user(email: "wontsee@example.com"))

      conn = gql(conn, @current_user_query)

      # `current_user` is filtered to the actor, so with no actor it resolves
      # to nothing.
      assert %{"data" => %{"currentUser" => nil}} = json(conn)
      refute conn.resp_body =~ "@example.com"
    end
  end

  describe "deleteUser mutation" do
    test "a user can delete their own account once they own no organizations", %{conn: conn} do
      email = "del@example.com"
      user = generate(AccountsGenerator.user(email: email))
      drop_personal_org(user)

      conn =
        conn
        |> put_req_header("cookie", "#{@auth_cookie}=#{user.__metadata__.token}")
        |> gql(@delete_user_mutation, %{"id" => user.id})

      assert %{"data" => %{"deleteUser" => %{"errors" => []}}} = json(conn)
      assert {:error, _} = Accounts.sign_in_user(email, "password1234")
    end

    test "deletion is blocked while the user solely owns an organization", %{conn: conn} do
      email = "delblocked@example.com"
      user = generate(AccountsGenerator.user(email: email))

      conn =
        conn
        |> put_req_header("cookie", "#{@auth_cookie}=#{user.__metadata__.token}")
        |> gql(@delete_user_mutation, %{"id" => user.id})

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
        |> put_req_header("cookie", "#{@remember_cookie}=#{remember_token}")
        |> gql(@current_user_query)

      assert %{"data" => %{"currentUser" => %{"email" => ^email}}} = json(conn)
      # A fresh session cookie should have been minted by the plug.
      assert is_binary(auth_cookie_value(conn))
    end

    test "a token close to expiry is rotated and the old one revoked", %{conn: conn} do
      email = "rotate@example.com"
      user = generate(AccountsGenerator.user(email: email, remember_me: true))
      old_token = user.__metadata__.remember_me.token

      # A fresh 30-day token inside a 31-day refresh window counts as close to
      # expiry, so this request must rotate.
      opts = RememberMe.init(refresh_within: {31, :days})

      conn =
        conn
        |> put_req_header("cookie", "#{@remember_cookie}=#{old_token}")
        |> RememberMe.call(opts)

      assert to_string(conn.assigns.current_user.email) == email
      assert is_binary(auth_cookie_value(conn))

      new_cookie = conn.resp_cookies[@remember_cookie]
      assert is_binary(new_cookie[:value])
      refute new_cookie[:value] == old_token
      assert new_cookie[:max_age] == 2_592_000

      assert TokenResource.Actions.token_revoked?(Token, old_token)
    end
  end

  describe "signOut mutation" do
    test "revokes both tokens and clears both cookies", %{conn: conn} do
      user = generate(AccountsGenerator.user(email: "out@example.com", remember_me: true))
      token = user.__metadata__.token
      remember_token = user.__metadata__.remember_me.token

      conn =
        conn
        |> put_req_header(
          "cookie",
          "#{@auth_cookie}=#{token}; #{@remember_cookie}=#{remember_token}"
        )
        |> gql(@sign_out_mutation)

      assert %{"data" => %{"signOut" => "SUCCESSFUL_SIGNOUT"}} = json(conn)

      assert conn.resp_cookies[@auth_cookie][:max_age] == 0
      assert conn.resp_cookies[@remember_cookie][:max_age] == 0

      assert TokenResource.Actions.token_revoked?(Token, token)
      assert TokenResource.Actions.token_revoked?(Token, remember_token)
    end

    test "the revoked token can no longer authenticate", %{conn: conn} do
      user = generate(AccountsGenerator.user(email: "revoked@example.com"))
      token = user.__metadata__.token

      conn
      |> put_req_header("cookie", "#{@auth_cookie}=#{token}")
      |> gql(@sign_out_mutation)

      replayed =
        build_conn()
        |> put_req_header("cookie", "#{@auth_cookie}=#{token}")
        |> gql(@current_user_query)

      assert %{"data" => %{"currentUser" => nil}} = json(replayed)
    end

    test "signing out without a session is refused", %{conn: conn} do
      conn = gql(conn, @sign_out_mutation)

      assert %{"errors" => [_ | _]} = json(conn)
    end
  end

  describe "expired session rejection" do
    test "a client claiming a session it no longer has is rejected", %{conn: conn} do
      conn =
        conn
        |> put_req_header("x-session", "active")
        |> put_req_header("cookie", "#{@auth_cookie}=not-a-real-token")
        |> gql(@current_user_query)

      assert conn.status == 401
      # The stale cookie is cleared, so the client stops presenting it.
      assert conn.resp_cookies[@auth_cookie][:max_age] == 0
    end

    test "a signed-out client is never rejected, even carrying a stale cookie", %{conn: conn} do
      email = "stale@example.com"
      generate(AccountsGenerator.user(email: email))

      # No x-session header: this is the login page retrying after the session
      # died, with the dead cookie still attached by the browser.
      conn =
        conn
        |> put_req_header("cookie", "#{@auth_cookie}=not-a-real-token")
        |> gql(@sign_in_mutation, %{"email" => email, "password" => "password1234"})

      assert %{"data" => %{"signIn" => %{"email" => ^email}}} = json(conn)
    end

    test "a live session with the header passes through", %{conn: conn} do
      email = "live@example.com"
      user = generate(AccountsGenerator.user(email: email))

      conn =
        conn
        |> put_req_header("x-session", "active")
        |> put_req_header("cookie", "#{@auth_cookie}=#{user.__metadata__.token}")
        |> gql(@current_user_query)

      assert %{"data" => %{"currentUser" => %{"email" => ^email}}} = json(conn)
    end

    test "remember-me re-login wins over rejection", %{conn: conn} do
      email = "remembered@example.com"
      user = generate(AccountsGenerator.user(email: email, remember_me: true))
      remember_token = user.__metadata__.remember_me.token

      conn =
        conn
        |> put_req_header("x-session", "active")
        |> put_req_header("cookie", "#{@remember_cookie}=#{remember_token}")
        |> gql(@current_user_query)

      assert %{"data" => %{"currentUser" => %{"email" => ^email}}} = json(conn)
    end
  end

  defp gql(conn, query, variables \\ %{}) do
    conn
    |> put_req_header("content-type", "application/json")
    |> post("/gql", Jason.encode!(%{"query" => query, "variables" => variables}))
  end

  defp json(conn) do
    assert conn.status == 200
    Jason.decode!(conn.resp_body)
  end

  defp register_input(email) do
    password = "password1234"

    %{
      "email" => email,
      "password" => password,
      "passwordConfirmation" => password
    }
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
