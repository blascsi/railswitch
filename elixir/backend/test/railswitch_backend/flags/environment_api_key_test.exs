defmodule RailswitchBackend.Flags.EnvironmentApiKeyTest do
  @moduledoc """
  Action tests for `RailswitchBackend.Flags.EnvironmentApiKey`.
  """
  use RailswitchBackend.DataCase, async: true

  import Ash.Generator

  alias Ash.Error.Forbidden
  alias Ash.Error.Invalid
  alias Ash.Error.Query.NotFound
  alias RailswitchBackend.AccountsGenerator
  alias RailswitchBackend.Flags
  alias RailswitchBackend.FlagsGenerator
  alias RailswitchBackend.Orgs.Errors.NotOrganizationMember
  alias RailswitchBackend.OrgsGenerator

  setup do
    user = generate(AccountsGenerator.user())
    org = generate(OrgsGenerator.organization(actor: user))
    project = generate(FlagsGenerator.project(tenant: org.id))

    environment =
      generate(FlagsGenerator.environment(tenant: org.id, project_id: project.id))

    outsider = generate(AccountsGenerator.user())

    %{
      user: user,
      org: org,
      project: project,
      environment: environment,
      outsider: outsider
    }
  end

  describe "get_environment_api_key_by_id" do
    setup :with_api_key

    test "returns the api key to a member", ctx do
      assert {:ok, found} =
               Flags.get_environment_api_key_by_id(ctx.api_key.id,
                 tenant: ctx.org.id,
                 actor: ctx.user
               )

      assert found.id == ctx.api_key.id
      assert found.name == ctx.api_key.name
    end

    test "policy - an outsider is refused", ctx do
      assert {:error, %Forbidden{errors: [%NotOrganizationMember{}]}} =
               Flags.get_environment_api_key_by_id(ctx.api_key.id,
                 tenant: ctx.org.id,
                 actor: ctx.outsider
               )
    end

    test "policy - a request without an actor is refused", ctx do
      assert {:error, %Forbidden{errors: [%NotOrganizationMember{}]}} =
               Flags.get_environment_api_key_by_id(ctx.api_key.id, tenant: ctx.org.id)
    end

    for status <- [:pending, :declined] do
      @tag status: status
      test "policy - a user with a #{status} membership is refused", ctx do
        invitee = generate(AccountsGenerator.user())

        generate(
          OrgsGenerator.membership(
            organization_id: ctx.org.id,
            user_id: invitee.id,
            status: ctx.status
          )
        )

        assert {:error, %Forbidden{errors: [%NotOrganizationMember{}]}} =
                 Flags.get_environment_api_key_by_id(ctx.api_key.id,
                   tenant: ctx.org.id,
                   actor: invitee
                 )
      end
    end
  end

  describe "create_environment_api_key" do
    test "sets the organization from the tenant and returns the plaintext key", ctx do
      key_name = "test_key"

      api_key =
        Flags.create_environment_api_key!(%{name: key_name, environment_id: ctx.environment.id},
          tenant: ctx.org.id,
          actor: ctx.user
        )

      assert api_key.organization_id == ctx.org.id
      assert api_key.environment_id == ctx.environment.id
      assert String.starts_with?(api_key.__metadata__.plaintext_api_key, "railswitch_")
      assert to_string(api_key.name) == key_name
    end

    test "policy - an outsider is refused", ctx do
      assert {:error, %Forbidden{}} =
               Flags.create_environment_api_key(
                 %{name: "test_key", environment_id: ctx.environment.id},
                 tenant: ctx.org.id,
                 actor: ctx.outsider
               )
    end

    test "policy - a request without an actor is refused", ctx do
      assert {:error, %Forbidden{}} =
               Flags.create_environment_api_key(
                 %{name: "test_key", environment_id: ctx.environment.id},
                 tenant: ctx.org.id
               )
    end

    for status <- [:pending, :declined] do
      @tag status: status
      test "policy - a user with a #{status} membership is refused", ctx do
        invitee = generate(AccountsGenerator.user())

        generate(
          OrgsGenerator.membership(
            organization_id: ctx.org.id,
            user_id: invitee.id,
            status: ctx.status
          )
        )

        assert {:error, %Forbidden{}} =
                 Flags.create_environment_api_key(
                   %{name: "test_key", environment_id: ctx.environment.id},
                   tenant: ctx.org.id,
                   actor: invitee
                 )
      end
    end
  end

  describe "delete_environment_api_key" do
    setup :with_api_key

    test "deletes the api key for a member", ctx do
      assert :ok =
               Flags.delete_environment_api_key!(ctx.api_key, tenant: ctx.org.id, actor: ctx.user)

      assert {:error, %Invalid{errors: [%NotFound{}]}} =
               Flags.get_environment_api_key_by_id(ctx.api_key.id,
                 tenant: ctx.org.id,
                 actor: ctx.user
               )
    end

    test "policy - an outsider is refused", ctx do
      assert {:error, %Forbidden{}} =
               Flags.delete_environment_api_key(ctx.api_key,
                 tenant: ctx.org.id,
                 actor: ctx.outsider
               )
    end

    test "policy - a request without an actor is refused", ctx do
      assert {:error, %Forbidden{}} =
               Flags.delete_environment_api_key(ctx.api_key, tenant: ctx.org.id)
    end

    for status <- [:pending, :declined] do
      @tag status: status
      test "policy - a user with a #{status} membership is refused", ctx do
        invitee = generate(AccountsGenerator.user())

        generate(
          OrgsGenerator.membership(
            organization_id: ctx.org.id,
            user_id: invitee.id,
            status: ctx.status
          )
        )

        assert {:error, %Forbidden{}} =
                 Flags.delete_environment_api_key(ctx.api_key,
                   tenant: ctx.org.id,
                   actor: invitee
                 )
      end
    end
  end

  describe "mark_environment_api_key_as_used_now" do
    setup :with_api_key

    test "records the time of use for the system", ctx do
      assert {:ok, api_key} =
               Flags.mark_environment_api_key_as_used_now(ctx.api_key,
                 tenant: ctx.org.id,
                 authorize?: false
               )

      assert %DateTime{} = api_key.last_used
    end

    test "policy - a member is refused", ctx do
      assert {:error, %Forbidden{}} =
               Flags.mark_environment_api_key_as_used_now(ctx.api_key,
                 tenant: ctx.org.id,
                 actor: ctx.user
               )
    end

    test "policy - a request without an actor is refused", ctx do
      assert {:error, %Forbidden{}} =
               Flags.mark_environment_api_key_as_used_now(ctx.api_key, tenant: ctx.org.id)
    end
  end

  defp with_api_key(ctx) do
    api_key =
      generate(FlagsGenerator.api_key(tenant: ctx.org.id, environment_id: ctx.environment.id))

    %{api_key: api_key}
  end
end
