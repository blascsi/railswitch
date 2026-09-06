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

    %{user: user, org: org, project: project, outsider: outsider}
  end

  describe "create" do
    test "a member can create an environment", ctx do
      env =
        Flags.create_environment!(
          %{name: "production", project_id: ctx.project.id},
          tenant: ctx.org.id,
          actor: ctx.user
        )

      assert to_string(env.name) == "production"
    end

    test "an outsider cannot create an environment", ctx do
      assert {:error, %Forbidden{}} =
               Flags.create_environment(
                 %{name: "production", project_id: ctx.project.id},
                 tenant: ctx.org.id,
                 actor: ctx.outsider
               )
    end

    test "a request without an actor cannot create an environment", ctx do
      assert {:error, %Forbidden{}} =
               Flags.create_environment(
                 %{name: "production", project_id: ctx.project.id},
                 tenant: ctx.org.id
               )
    end
  end

  describe "read" do
    test "get_environment_by_project_id_and_name finds the environment by name within the project",
         ctx do
      env =
        Flags.create_environment!(
          %{name: "production", project_id: ctx.project.id},
          tenant: ctx.org.id,
          actor: ctx.user
        )

      assert {:ok, found} =
               Flags.get_environment_by_project_id_and_name(ctx.project.id, "production",
                 tenant: ctx.org.id,
                 actor: ctx.user
               )

      assert found.id == env.id
    end

    test "get_environment_by_project_id_and_name does not find an environment belonging to another project",
         ctx do
      other_project = generate(FlagsGenerator.project(tenant: ctx.org.id))

      Flags.create_environment!(
        %{name: "staging", project_id: other_project.id},
        tenant: ctx.org.id,
        actor: ctx.user
      )

      assert {:error, %Invalid{}} =
               Flags.get_environment_by_project_id_and_name(ctx.project.id, "staging",
                 tenant: ctx.org.id,
                 actor: ctx.user
               )
    end

    test "with get_environment_by_project_id_and_name an outsider cannot find an environment",
         ctx do
      Flags.create_environment!(
        %{name: "production", project_id: ctx.project.id},
        tenant: ctx.org.id,
        actor: ctx.user
      )

      assert {:error, %Forbidden{errors: [%NotOrganizationMember{}]}} =
               Flags.get_environment_by_project_id_and_name(ctx.project.id, "production",
                 tenant: ctx.org.id,
                 actor: ctx.outsider
               )
    end

    test "a get_environment_by_project_id_and_name request without an actor cannot find an environment",
         ctx do
      Flags.create_environment!(
        %{name: "production", project_id: ctx.project.id},
        tenant: ctx.org.id,
        actor: ctx.user
      )

      assert {:error, %Forbidden{errors: [%NotOrganizationMember{}]}} =
               Flags.get_environment_by_project_id_and_name(ctx.project.id, "production", tenant: ctx.org.id)
    end

    test "get_environment_by_project_and_environment_name finds the environment by name within the project",
         ctx do
      env =
        Flags.create_environment!(
          %{name: "production", project_id: ctx.project.id},
          tenant: ctx.org.id,
          actor: ctx.user
        )

      assert {:ok, found} =
               Flags.get_environment_by_project_and_environment_name(
                 %{project_name: ctx.project.name, environment_name: "production"},
                 tenant: ctx.org.id,
                 actor: ctx.user
               )

      assert found.id == env.id
    end

    test "get_environment_by_project_and_environment_name does not find an environment belonging to another project",
         ctx do
      other_project = generate(FlagsGenerator.project(tenant: ctx.org.id))

      Flags.create_environment!(
        %{name: "staging", project_id: other_project.id},
        tenant: ctx.org.id,
        actor: ctx.user
      )

      assert {:error, %Invalid{}} =
               Flags.get_environment_by_project_and_environment_name(
                 %{project_name: ctx.project.name, environment_name: "staging"},
                 tenant: ctx.org.id,
                 actor: ctx.user
               )
    end

    test "with get_environment_by_project_and_environment_name an outsider cannot find an environment",
         ctx do
      Flags.create_environment!(
        %{name: "production", project_id: ctx.project.id},
        tenant: ctx.org.id,
        actor: ctx.user
      )

      assert {:error, %Forbidden{errors: [%NotOrganizationMember{}]}} =
               Flags.get_environment_by_project_and_environment_name(
                 %{project_name: ctx.project.id, environment_name: "production"},
                 tenant: ctx.org.id,
                 actor: ctx.outsider
               )
    end

    test "a get_environment_by_project_and_environment_name request without an actor cannot find an environment",
         ctx do
      Flags.create_environment!(
        %{name: "production", project_id: ctx.project.id},
        tenant: ctx.org.id,
        actor: ctx.user
      )

      assert {:error, %Forbidden{errors: [%NotOrganizationMember{}]}} =
               Flags.get_environment_by_project_and_environment_name(
                 %{project_name: ctx.project.id, environment_name: "production"},
                 tenant: ctx.org.id
               )
    end
  end

  describe "destroy" do
    test "a member can destroy an environment", ctx do
      env =
        Flags.create_environment!(
          %{name: "production", project_id: ctx.project.id},
          tenant: ctx.org.id,
          actor: ctx.user
        )

      assert :ok = Flags.delete_environment(env, tenant: ctx.org.id, actor: ctx.user)
    end

    test "an outsider cannot destroy an environment", ctx do
      env =
        Flags.create_environment!(
          %{name: "production", project_id: ctx.project.id},
          tenant: ctx.org.id,
          actor: ctx.user
        )

      assert {:error, %Forbidden{}} =
               Flags.delete_environment(env, tenant: ctx.org.id, actor: ctx.outsider)
    end

    test "a request without an actor cannot destroy an environment", ctx do
      env =
        Flags.create_environment!(
          %{name: "production", project_id: ctx.project.id},
          tenant: ctx.org.id,
          actor: ctx.user
        )

      assert {:error, %Forbidden{}} =
               Flags.delete_environment(env, tenant: ctx.org.id)
    end
  end
end
