defmodule RailswitchBackend.Flags.EnvironmentTest do
  @moduledoc """
  Action tests for `RailswitchBackend.Flags.Environment`.
  """
  use RailswitchBackend.DataCase, async: true

  import Ash.Generator

  alias Ash.Error.Forbidden
  alias Ash.Error.Invalid
  alias RailswitchBackend.AccountsGenerator
  alias RailswitchBackend.Flags
  alias RailswitchBackend.FlagsGenerator
  alias RailswitchBackend.Orgs.Errors.NotOrganizationMember
  alias RailswitchBackend.OrgsGenerator

  setup do
    user = generate(AccountsGenerator.user())
    org = generate(OrgsGenerator.organization(actor: user))
    project = generate(FlagsGenerator.project(tenant: org.id))
    outsider = generate(AccountsGenerator.user())

    %{
      user: user,
      org: org,
      project: project,
      outsider: outsider
    }
  end

  describe "get_environment_by_project_id_and_name" do
    setup :with_environment

    test "returns the matching environment to a member", ctx do
      assert {:ok, found} =
               Flags.get_environment_by_project_id_and_name(ctx.project.id, "production",
                 tenant: ctx.org.id,
                 actor: ctx.user
               )

      assert found.id == ctx.environment.id
    end

    test "does not return an environment belonging to another project", ctx do
      other_project = generate(FlagsGenerator.project(tenant: ctx.org.id))

      generate(
        FlagsGenerator.environment(
          tenant: ctx.org.id,
          project_id: other_project.id,
          name: "staging"
        )
      )

      assert {:error, %Invalid{}} =
               Flags.get_environment_by_project_id_and_name(ctx.project.id, "staging",
                 tenant: ctx.org.id,
                 actor: ctx.user
               )
    end

    test "policy - an outsider is refused", ctx do
      assert {:error, %Forbidden{errors: [%NotOrganizationMember{}]}} =
               Flags.get_environment_by_project_id_and_name(ctx.project.id, "production",
                 tenant: ctx.org.id,
                 actor: ctx.outsider
               )
    end

    test "policy - a request without an actor is refused", ctx do
      assert {:error, %Forbidden{errors: [%NotOrganizationMember{}]}} =
               Flags.get_environment_by_project_id_and_name(ctx.project.id, "production", tenant: ctx.org.id)
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
                 Flags.get_environment_by_project_id_and_name(ctx.project.id, "production",
                   tenant: ctx.org.id,
                   actor: invitee
                 )
      end
    end
  end

  describe "get_environment_by_project_and_environment_name" do
    setup :with_environment

    test "returns the matching environment to a member", ctx do
      assert {:ok, found} =
               Flags.get_environment_by_project_and_environment_name(
                 %{project_name: ctx.project.name, environment_name: "production"},
                 tenant: ctx.org.id,
                 actor: ctx.user
               )

      assert found.id == ctx.environment.id
    end

    test "does not return an environment belonging to another project", ctx do
      other_project = generate(FlagsGenerator.project(tenant: ctx.org.id))

      generate(
        FlagsGenerator.environment(
          tenant: ctx.org.id,
          project_id: other_project.id,
          name: "staging"
        )
      )

      assert {:error, %Invalid{}} =
               Flags.get_environment_by_project_and_environment_name(
                 %{project_name: ctx.project.name, environment_name: "staging"},
                 tenant: ctx.org.id,
                 actor: ctx.user
               )
    end

    test "policy - an outsider is refused", ctx do
      assert {:error, %Forbidden{errors: [%NotOrganizationMember{}]}} =
               Flags.get_environment_by_project_and_environment_name(
                 %{project_name: ctx.project.name, environment_name: "production"},
                 tenant: ctx.org.id,
                 actor: ctx.outsider
               )
    end

    test "policy - a request without an actor is refused", ctx do
      assert {:error, %Forbidden{errors: [%NotOrganizationMember{}]}} =
               Flags.get_environment_by_project_and_environment_name(
                 %{project_name: ctx.project.name, environment_name: "production"},
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

        assert {:error, %Forbidden{errors: [%NotOrganizationMember{}]}} =
                 Flags.get_environment_by_project_and_environment_name(
                   %{project_name: ctx.project.name, environment_name: "production"},
                   tenant: ctx.org.id,
                   actor: invitee
                 )
      end
    end
  end

  describe "create_environment" do
    test "creates the environment for a member", ctx do
      env =
        Flags.create_environment!(
          %{name: "production", project_id: ctx.project.id},
          tenant: ctx.org.id,
          actor: ctx.user
        )

      assert to_string(env.name) == "production"
    end

    test "policy - an outsider is refused", ctx do
      assert {:error, %Forbidden{}} =
               Flags.create_environment(
                 %{name: "production", project_id: ctx.project.id},
                 tenant: ctx.org.id,
                 actor: ctx.outsider
               )
    end

    test "policy - a request without an actor is refused", ctx do
      assert {:error, %Forbidden{}} =
               Flags.create_environment(
                 %{name: "production", project_id: ctx.project.id},
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
                 Flags.create_environment(
                   %{name: "production", project_id: ctx.project.id},
                   tenant: ctx.org.id,
                   actor: invitee
                 )
      end
    end
  end

  describe "delete_environment" do
    setup :with_environment

    test "deletes the environment for a member", ctx do
      assert :ok = Flags.delete_environment(ctx.environment, tenant: ctx.org.id, actor: ctx.user)
    end

    test "policy - an outsider is refused", ctx do
      assert {:error, %Forbidden{}} =
               Flags.delete_environment(ctx.environment, tenant: ctx.org.id, actor: ctx.outsider)
    end

    test "policy - a request without an actor is refused", ctx do
      assert {:error, %Forbidden{}} =
               Flags.delete_environment(ctx.environment, tenant: ctx.org.id)
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
                 Flags.delete_environment(ctx.environment, tenant: ctx.org.id, actor: invitee)
      end
    end
  end

  defp with_environment(ctx) do
    environment =
      generate(
        FlagsGenerator.environment(
          tenant: ctx.org.id,
          project_id: ctx.project.id,
          name: "production"
        )
      )

    %{environment: environment}
  end
end
