defmodule RailswitchBackend.Flags.FlagTest do
  @moduledoc """
  Action tests for `RailswitchBackend.Flags.Flag`.
  """
  use RailswitchBackend.DataCase, async: true

  import Ash.Generator

  alias Ash.Error.Forbidden
  alias Ash.Error.Invalid
  alias RailswitchBackend.AccountsGenerator
  alias RailswitchBackend.Flags
  alias RailswitchBackend.Flags.FlagEnvironment.Defaults
  alias RailswitchBackend.FlagsGenerator
  alias RailswitchBackend.OrgsGenerator

  setup do
    user = generate(AccountsGenerator.user())
    org = generate(OrgsGenerator.organization(actor: user))
    project = generate(FlagsGenerator.project(tenant: org.id))
    environment = generate(FlagsGenerator.environment(tenant: org.id, project_id: project.id))
    outsider = generate(AccountsGenerator.user())

    %{user: user, org: org, project: project, environment: environment, outsider: outsider}
  end

  describe "create" do
    test "a member can create a flag, auto-creating its flag environments", ctx do
      flag =
        Flags.create_flag!(%{name: "checkout", project_id: ctx.project.id},
          tenant: ctx.org.id,
          actor: ctx.user
        )

      assert to_string(flag.name) == "checkout"

      assert [flag_environment] =
               Flags.list_flag_environments!(
                 query: [filter: [flag_id: flag.id, environment_id: ctx.environment.id]],
                 tenant: ctx.org.id,
                 actor: ctx.user
               )

      assert flag_environment.rules == Defaults.rules()
    end

    test "an outsider cannot create a flag", ctx do
      assert {:error, %Forbidden{}} =
               Flags.create_flag(%{name: "checkout", project_id: ctx.project.id},
                 tenant: ctx.org.id,
                 actor: ctx.outsider
               )

      assert {:ok, []} = Flags.list_flags(tenant: ctx.org.id, actor: ctx.user)
    end

    test "a request without an actor cannot create a flag", ctx do
      assert {:error, %Forbidden{}} =
               Flags.create_flag(%{name: "checkout", project_id: ctx.project.id},
                 tenant: ctx.org.id
               )
    end
  end

  describe "read" do
    test "a member can list flags", ctx do
      flag =
        Flags.create_flag!(%{name: "checkout", project_id: ctx.project.id},
          tenant: ctx.org.id,
          actor: ctx.user
        )

      assert {:ok, flags} = Flags.list_flags(tenant: ctx.org.id, actor: ctx.user)
      assert Enum.any?(flags, &(&1.id == flag.id))
    end

    test "an outsider cannot list flags", ctx do
      Flags.create_flag!(%{name: "checkout", project_id: ctx.project.id},
        tenant: ctx.org.id,
        actor: ctx.user
      )

      assert {:ok, []} = Flags.list_flags(tenant: ctx.org.id, actor: ctx.outsider)
    end

    test "a request without an actor cannot list flags", ctx do
      Flags.create_flag!(%{name: "checkout", project_id: ctx.project.id},
        tenant: ctx.org.id,
        actor: ctx.user
      )

      assert {:ok, []} = Flags.list_flags(tenant: ctx.org.id)
    end

    test "get_flag_by_project_and_flag_name returns the correct flag", ctx do
      flag =
        Flags.create_flag!(%{name: "checkout", project_id: ctx.project.id},
          tenant: ctx.org.id,
          actor: ctx.user
        )

      assert {:ok, found_flag} =
               Flags.get_flag_by_project_and_flag_name(
                 %{project_name: ctx.project.name, flag_name: flag.name},
                 tenant: ctx.org.id,
                 actor: ctx.user
               )

      assert found_flag.id == flag.id
    end

    test "get_flag_by_project_and_flag_name does not return the flag for an outsider", ctx do
      flag =
        Flags.create_flag!(%{name: "checkout", project_id: ctx.project.id},
          tenant: ctx.org.id,
          actor: ctx.user
        )

      assert {:error, %Invalid{}} =
               Flags.get_flag_by_project_and_flag_name(
                 %{project_name: ctx.project.name, flag_name: flag.name},
                 tenant: ctx.org.id,
                 actor: ctx.outsider
               )
    end

    test "get_flag_by_project_and_flag_name does not return the flag without an actor", ctx do
      flag =
        Flags.create_flag!(%{name: "checkout", project_id: ctx.project.id},
          tenant: ctx.org.id,
          actor: ctx.user
        )

      assert {:error, %Invalid{}} =
               Flags.get_flag_by_project_and_flag_name(
                 %{project_name: ctx.project.name, flag_name: flag.name},
                 tenant: ctx.org.id
               )
    end
  end

  describe "destroy" do
    test "a member can destroy a flag", ctx do
      flag =
        Flags.create_flag!(%{name: "checkout", project_id: ctx.project.id},
          tenant: ctx.org.id,
          actor: ctx.user
        )

      assert :ok = Flags.delete_flag(flag, tenant: ctx.org.id, actor: ctx.user)
    end

    test "an outsider cannot destroy a flag", ctx do
      flag =
        Flags.create_flag!(%{name: "checkout", project_id: ctx.project.id},
          tenant: ctx.org.id,
          actor: ctx.user
        )

      assert {:error, %Forbidden{}} =
               Flags.delete_flag(flag, tenant: ctx.org.id, actor: ctx.outsider)
    end

    test "a request without an actor cannot destroy a flag", ctx do
      flag =
        Flags.create_flag!(%{name: "checkout", project_id: ctx.project.id},
          tenant: ctx.org.id,
          actor: ctx.user
        )

      assert {:error, %Forbidden{}} =
               Flags.delete_flag(flag, tenant: ctx.org.id)
    end
  end
end
