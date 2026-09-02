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
  alias RailswitchBackend.OrgsGenerator

  setup do
    user = generate(AccountsGenerator.user())
    org = generate(OrgsGenerator.organization(actor: user))
    project = generate(FlagsGenerator.project(tenant: org.id))

    environment =
      generate(FlagsGenerator.environment(tenant: org.id, project_id: project.id))

    outsider = generate(AccountsGenerator.user())

    %{user: user, org: org, project: project, environment: environment, outsider: outsider}
  end

  describe "create" do
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

    test "an outsider cannot create an api key", ctx do
      assert {:error, %Forbidden{}} =
               Flags.create_environment_api_key(
                 %{name: "test_key", environment_id: ctx.environment.id},
                 tenant: ctx.org.id,
                 actor: ctx.outsider
               )
    end

    test "a request without an actor cannot create an api key", ctx do
      assert {:error, %Forbidden{}} =
               Flags.create_environment_api_key(
                 %{name: "test_key", environment_id: ctx.environment.id},
                 tenant: ctx.org.id
               )
    end
  end

  describe "read" do
    test "a member can look up the api key by id", ctx do
      api_key =
        Flags.create_environment_api_key!(%{name: "test_key", environment_id: ctx.environment.id},
          tenant: ctx.org.id,
          actor: ctx.user
        )

      assert {:ok, found} =
               Flags.get_environment_api_key_by_id(api_key.id,
                 tenant: ctx.org.id,
                 actor: ctx.user
               )

      assert found.id == api_key.id
      assert found.name == api_key.name
    end

    test "an outsider cannot look up the api key by id", ctx do
      api_key =
        Flags.create_environment_api_key!(%{name: "test_key", environment_id: ctx.environment.id},
          tenant: ctx.org.id,
          actor: ctx.user
        )

      assert {:error, %Invalid{errors: [%NotFound{}]}} =
               Flags.get_environment_api_key_by_id(api_key.id,
                 tenant: ctx.org.id,
                 actor: ctx.outsider
               )
    end

    test "a request without an actor cannot look up the api key by id", ctx do
      api_key =
        Flags.create_environment_api_key!(%{name: "test_key", environment_id: ctx.environment.id},
          tenant: ctx.org.id,
          actor: ctx.user
        )

      assert {:error, %Invalid{errors: [%NotFound{}]}} =
               Flags.get_environment_api_key_by_id(api_key.id, tenant: ctx.org.id)
    end
  end

  describe "destroy" do
    test "deletes the api key", ctx do
      api_key =
        Flags.create_environment_api_key!(%{name: "test_key", environment_id: ctx.environment.id},
          tenant: ctx.org.id,
          actor: ctx.user
        )

      assert :ok = Flags.delete_environment_api_key!(api_key, tenant: ctx.org.id, actor: ctx.user)

      assert {:error, %Invalid{errors: [%NotFound{}]}} =
               Flags.get_environment_api_key_by_id(api_key.id,
                 tenant: ctx.org.id,
                 actor: ctx.user
               )
    end

    test "an outsider cannot delete the api key", ctx do
      api_key =
        Flags.create_environment_api_key!(%{name: "test_key", environment_id: ctx.environment.id},
          tenant: ctx.org.id,
          actor: ctx.user
        )

      assert {:error, %Forbidden{}} =
               Flags.delete_environment_api_key(api_key, tenant: ctx.org.id, actor: ctx.outsider)
    end

    test "a request without an actor cannot delete the api key", ctx do
      api_key =
        Flags.create_environment_api_key!(%{name: "test_key", environment_id: ctx.environment.id},
          tenant: ctx.org.id,
          actor: ctx.user
        )

      assert {:error, %Forbidden{}} =
               Flags.delete_environment_api_key(api_key, tenant: ctx.org.id)
    end
  end
end
