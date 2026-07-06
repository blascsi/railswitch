defmodule RailswitchBackend.Flags.FlagEnvironmentTest do
  @moduledoc """
  Action tests for `RailswitchBackend.Flags.FlagEnvironment`.
  """
  use RailswitchBackend.DataCase, async: true

  import Ash.Generator

  alias Ash.Error.Forbidden
  alias RailswitchBackend.AccountsGenerator
  alias RailswitchBackend.Flags
  alias RailswitchBackend.FlagsGenerator
  alias RailswitchBackend.OrgsGenerator

  setup do
    user = generate(AccountsGenerator.user())
    org = generate(OrgsGenerator.organization(actor: user))
    project = generate(FlagsGenerator.project(tenant: org.id))
    environment = generate(FlagsGenerator.environment(tenant: org.id, project_id: project.id))

    flag =
      Flags.create_flag!(%{name: "checkout", project_id: project.id}, tenant: org.id, actor: user)

    [flag_environment] =
      Flags.list_flag_environments!(
        query: [filter: [flag_id: flag.id, environment_id: environment.id]],
        tenant: org.id,
        actor: user
      )

    outsider = generate(AccountsGenerator.user())

    %{
      user: user,
      org: org,
      project: project,
      environment: environment,
      flag: flag,
      flag_environment: flag_environment,
      outsider: outsider
    }
  end

  describe "read" do
    test "a member can list flag environments", ctx do
      assert {:ok, [found]} =
               Flags.list_flag_environments(
                 query: [filter: [id: ctx.flag_environment.id]],
                 tenant: ctx.org.id,
                 actor: ctx.user
               )

      assert found.id == ctx.flag_environment.id
    end

    test "an outsider cannot list flag environments", ctx do
      assert {:ok, []} =
               Flags.list_flag_environments(
                 query: [filter: [id: ctx.flag_environment.id]],
                 tenant: ctx.org.id,
                 actor: ctx.outsider
               )
    end

    test "a request without an actor cannot list flag environments", ctx do
      assert {:ok, []} =
               Flags.list_flag_environments(
                 query: [filter: [id: ctx.flag_environment.id]],
                 tenant: ctx.org.id
               )
    end
  end

  describe "update" do
    test "a member can update the rules", ctx do
      assert {:ok, updated} =
               Flags.update_flag_environments(
                 ctx.flag_environment,
                 %{rules: %{"enabled" => true}},
                 tenant: ctx.org.id,
                 actor: ctx.user
               )

      assert updated.rules == %{"enabled" => true}
    end

    test "an outsider cannot update the rules", ctx do
      assert {:error, %Forbidden{}} =
               Flags.update_flag_environments(
                 ctx.flag_environment,
                 %{rules: %{"enabled" => true}},
                 tenant: ctx.org.id,
                 actor: ctx.outsider
               )
    end

    test "a request without an actor cannot update the rules", ctx do
      assert {:error, %Forbidden{}} =
               Flags.update_flag_environments(
                 ctx.flag_environment,
                 %{rules: %{"enabled" => true}},
                 tenant: ctx.org.id
               )
    end
  end

  describe "destroy" do
    test "a member can destroy a flag environment", ctx do
      assert :ok =
               Flags.delete_flag_environments(ctx.flag_environment,
                 tenant: ctx.org.id,
                 actor: ctx.user
               )
    end

    test "an outsider cannot destroy a flag environment", ctx do
      assert {:error, %Forbidden{}} =
               Flags.delete_flag_environments(ctx.flag_environment,
                 tenant: ctx.org.id,
                 actor: ctx.outsider
               )
    end

    test "a request without an actor cannot destroy a flag environment", ctx do
      assert {:error, %Forbidden{}} =
               Flags.delete_flag_environments(ctx.flag_environment, tenant: ctx.org.id)
    end
  end
end
