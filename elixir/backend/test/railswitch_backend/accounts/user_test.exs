defmodule RailswitchBackend.Accounts.UserTest do
  @moduledoc """
  Action and policy tests for `RailswitchBackend.Accounts.User`.
  """
  use RailswitchBackend.DataCase, async: true

  alias Ash.Error.Forbidden
  alias AshAuthentication.Info
  alias AshAuthentication.Strategy
  alias RailswitchBackend.Accounts
  alias RailswitchBackend.Accounts.Token
  alias RailswitchBackend.Accounts.User
  alias RailswitchBackend.Orgs
  alias RailswitchBackend.Orgs.Membership

  require Ash.Query

  @password "password1234"

  describe "register_with_password" do
    test "registers a user and hashes the password" do
      email = "alice@example.com"
      user = Accounts.register_user!(email, @password, @password)

      assert to_string(user.email) == email
      assert is_binary(user.hashed_password)
      refute user.hashed_password == @password
      assert Bcrypt.verify_pass(@password, user.hashed_password)
    end

    test "returns an auth token in metadata" do
      user = Accounts.register_user!(unique_email(), @password, @password)
      assert is_binary(user.__metadata__.token)
    end

    test "creates a personal organization owned by the user" do
      user = Accounts.register_user!("bob@example.com", @password, @password)

      assert [membership] = owned_memberships(user)
      assert membership.role == :owner
      assert membership.organization.name == "bob's organization"
    end

    test "requires a matching password confirmation" do
      assert {:error, error} =
               Accounts.register_user("mismatch@example.com", @password, "different1234")

      assert Exception.message(error) =~ "confirmation"
    end

    test "enforces the minimum password length" do
      assert {:error, error} = Accounts.register_user("short@example.com", "short", "short")

      assert Exception.message(error) =~ "length"
    end

    test "rejects a duplicate email" do
      dupe_email = "dupe@example.com"
      _user = Accounts.register_user!(dupe_email, @password, @password)

      assert {:error, error} = Accounts.register_user(dupe_email, @password, @password)

      assert Exception.message(error) =~ "already been taken"
    end

    test "issues a remember-me token when requested" do
      user = Accounts.register_user!(unique_email(), @password, @password, %{remember_me: true})

      assert %{token: token, cookie_name: :railswitch_remember_me, max_age: 2_592_000} =
               user.__metadata__.remember_me

      assert is_binary(token)
    end
  end

  describe "sign_in_with_password" do
    test "signs in with valid credentials and returns a token" do
      email = "signin@example.com"
      Accounts.register_user!(email, @password, @password)

      assert {:ok, user} = Accounts.sign_in_user(email, @password)
      assert to_string(user.email) == email
      assert is_binary(user.__metadata__.token)
    end

    test "rejects an invalid password" do
      email = "wrongpw@example.com"
      Accounts.register_user!(email, @password, @password)

      assert {:error, _} = Accounts.sign_in_user(email, "nope12345678")
    end

    test "rejects an unknown email" do
      assert {:error, _} = Accounts.sign_in_user("ghost@example.com", @password)
    end

    test "issues a remember-me token when requested" do
      email = "rmsignin@example.com"
      Accounts.register_user!(email, @password, @password)

      assert {:ok, user} =
               Accounts.sign_in_user(email, @password, %{remember_me: true})

      assert %{cookie_name: :railswitch_remember_me, token: token} = user.__metadata__.remember_me
      assert is_binary(token)
    end
  end

  describe "change_password" do
    test "changes the password when given the correct current password" do
      email = "cp@example.com"
      new_password = "newpassword12"
      user = Accounts.register_user!(email, @password, @password)

      assert {:ok, _updated} =
               Accounts.change_password(user, @password, new_password, new_password, actor: user)

      assert {:ok, _} = Accounts.sign_in_user(email, new_password)
      assert {:error, _} = Accounts.sign_in_user(email, @password)
    end

    test "rejects an incorrect current password" do
      new_password = "newpassword12"
      user = Accounts.register_user!("cp2@example.com", @password, @password)

      assert {:error, _} =
               Accounts.change_password(user, "wrongcurrent", new_password, new_password, actor: user)
    end

    test "a user cannot change another user's password" do
      new_password = "newpassword12"
      user = Accounts.register_user!(unique_email(), @password, @password)
      other = Accounts.register_user!(unique_email(), @password, @password)

      assert {:error, %Forbidden{}} =
               Accounts.change_password(user, @password, new_password, new_password, actor: other)
    end
  end

  describe "confirmation" do
    test "a newly registered user is unconfirmed" do
      user = Accounts.register_user!(unique_email(), @password, @password)
      assert is_nil(user.confirmed_at)
    end

    test "the emailed confirmation token confirms the user" do
      Accounts.register_user!("confirm@example.com", @password, @password)

      assert_receive {:email, %Swoosh.Email{subject: "Confirm your email address"} = email}
      token = token_from_email(email)

      strategy = Info.strategy!(User, :confirm_new_user)
      assert {:ok, confirmed} = Strategy.action(strategy, :confirm, %{"confirm" => token})
      assert confirmed.confirmed_at
    end
  end

  describe "log_out_everywhere" do
    test "changing the password revokes existing tokens" do
      new_password = "newpassword12"
      user = Accounts.register_user!("logout@example.com", @password, @password)

      old_token = user.__metadata__.token
      refute token_revoked?(old_token)

      {:ok, _} =
        Accounts.change_password(user, @password, new_password, new_password, actor: user)

      assert token_revoked?(old_token)
    end
  end

  describe "reset_password flow" do
    test "emails a reset token that can be used to set a new password" do
      email_address = "reset@example.com"
      new_password = "brandnewpw12"
      Accounts.register_user!(email_address, @password, @password)

      strategy = Info.strategy!(User, :password)

      assert :ok = Strategy.action(strategy, :reset_request, %{"email" => email_address})

      assert_receive {:email, %Swoosh.Email{subject: "Reset your password"} = email}
      token = token_from_email(email)

      assert {:ok, _user} =
               Strategy.action(strategy, :reset, %{
                 "reset_token" => token,
                 "password" => new_password,
                 "password_confirmation" => new_password
               })

      assert {:ok, _} = Accounts.sign_in_user(email_address, new_password)
    end

    test "resetting the password revokes existing sessions" do
      email = "resetlogout@example.com"
      new_password = "brandnewpw12"
      user = Accounts.register_user!(email, @password, @password)
      old_token = user.__metadata__.token
      refute token_revoked?(old_token)

      strategy = Info.strategy!(User, :password)

      assert :ok =
               Strategy.action(strategy, :reset_request, %{"email" => email})

      assert_receive {:email, %Swoosh.Email{subject: "Reset your password"} = email}
      token = token_from_email(email)

      assert {:ok, _} =
               Strategy.action(strategy, :reset, %{
                 "reset_token" => token,
                 "password" => new_password,
                 "password_confirmation" => new_password
               })

      assert token_revoked?(old_token)
    end

    test "a reset token cannot be reused" do
      email = "reuse@example.com"
      fist_pass = "firstpass1234"
      second_pass = "secondpass123"
      Accounts.register_user!(email, @password, @password)
      strategy = Info.strategy!(User, :password)

      assert :ok = Strategy.action(strategy, :reset_request, %{"email" => email})
      assert_receive {:email, %Swoosh.Email{subject: "Reset your password"} = email}
      token = token_from_email(email)

      assert {:ok, _} =
               Strategy.action(strategy, :reset, %{
                 "reset_token" => token,
                 "password" => fist_pass,
                 "password_confirmation" => fist_pass
               })

      assert {:error, _} =
               Strategy.action(strategy, :reset, %{
                 "reset_token" => token,
                 "password" => second_pass,
                 "password_confirmation" => second_pass
               })
    end

    test "requesting a reset for an unknown email sends nothing" do
      strategy = Info.strategy!(User, :password)

      assert :ok = Strategy.action(strategy, :reset_request, %{"email" => "nobody@example.com"})
      refute_receive {:email, _}, 100
    end
  end

  describe "destroy" do
    test "deletes a user who solely owns no organizations" do
      user = Accounts.register_user!(unique_email(), @password, @password)
      [membership] = owned_memberships(user)

      # Give up the only organization the registration created, otherwise the
      # solely-owned-organization guard blocks the account deletion.
      Orgs.delete_organization!(membership.organization, actor: user)

      assert :ok = Accounts.delete_user(user, actor: user)

      assert {:error, _} = Accounts.sign_in_user(to_string(user.email), @password)
    end

    test "blocks deletion while the user is the only owner of an organization" do
      user = Accounts.register_user!(unique_email(), @password, @password)

      assert {:error, error} = Accounts.delete_user(user, actor: user)
      assert Exception.message(error) =~ "only owner"
    end
  end

  describe "policies" do
    test "a user can read their own record via current_user" do
      user = Accounts.register_user!(unique_email(), @password, @password)

      assert {:ok, fetched} = Accounts.get_current_user(actor: user)
      assert fetched.id == user.id
    end

    test "a user cannot read another user's record" do
      user = Accounts.register_user!(unique_email(), @password, @password)
      other = Accounts.register_user!(unique_email(), @password, @password)

      # The read policy is a filter (`id == actor.id`), so another user's record
      # is simply invisible rather than producing a hard forbidden error.
      assert {:error, %Ash.Error.Invalid{errors: [%Ash.Error.Query.NotFound{}]}} =
               Accounts.get_user_by_id(other.id, actor: user)
    end

    test "an unauthenticated request cannot read a user" do
      user = Accounts.register_user!(unique_email(), @password, @password)

      assert {:error, _} = Accounts.get_user_by_id(user.id, actor: nil)
    end

    test "a user cannot delete another user's account" do
      user = Accounts.register_user!(unique_email(), @password, @password)
      other = Accounts.register_user!(unique_email(), @password, @password)

      assert {:error, %Forbidden{}} = Accounts.delete_user(other, actor: user)
    end
  end

  defp unique_email, do: "user#{System.unique_integer([:positive])}@example.com"

  defp owned_memberships(user) do
    Membership
    |> Ash.Query.filter(user_id == ^user.id)
    |> Ash.read!(authorize?: false)
    |> Ash.load!(:organization, authorize?: false)
  end

  defp token_revoked?(token) do
    Token
    |> Ash.ActionInput.for_action(:revoked?, %{token: token})
    |> Ash.run_action!(authorize?: false)
  end

  # Both the confirmation and reset emails render the token as the final
  # `<p>…</p>` of the HTML body.
  defp token_from_email(email) do
    [_, token] = Regex.run(~r/<p>([^<]+)<\/p>\s*$/, String.trim(email.html_body))
    String.trim(token)
  end
end
