defmodule RailswitchBackend.Flags.EnvironmentTest do
  @moduledoc """
  Action tests for `RailswitchBackend.Flags.Environment`.
  """
  use RailswitchBackend.DataCase, async: true

  import Ash.Generator

  alias RailswitchBackend.AccountsGenerator
  alias RailswitchBackend.Flags
  alias RailswitchBackend.FlagsGenerator
  alias RailswitchBackend.Orgs

  setup do
    user = generate(AccountsGenerator.user())
    org = Orgs.create_organization!("Environment Test Org", actor: user)
    project = generate(FlagsGenerator.project(tenant: org.id))

    %{org: org, project: project}
  end

  describe "read" do
    test "get_environment_by_name finds the environment by name within the project", ctx do
      env =
        Flags.create_environment!(
          %{name: "production", project_id: ctx.project.id},
          tenant: ctx.org.id
        )

      assert {:ok, found} =
               Flags.get_environment_by_name(ctx.project.id, "production", tenant: ctx.org.id)

      assert found.id == env.id
    end

    test "get_environment_by_name does not find an environment belonging to another project",
         ctx do
      other_project = generate(FlagsGenerator.project(tenant: ctx.org.id))

      Flags.create_environment!(
        %{name: "staging", project_id: other_project.id},
        tenant: ctx.org.id
      )

      assert {:error, %Ash.Error.Invalid{}} =
               Flags.get_environment_by_name(ctx.project.id, "staging", tenant: ctx.org.id)
    end
  end
end
