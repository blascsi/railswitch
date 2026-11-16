defmodule RailswitchBackend.Flags.FlagTest do
  @moduledoc """
  Action tests for `RailswitchBackend.Flags.Flag`.
  """
  use RailswitchBackend.DataCase, async: true

  import Ash.Generator

  alias Ash.Error.Forbidden
  alias RailswitchBackend.AccountsGenerator
  alias RailswitchBackend.Flags
  alias RailswitchBackend.Flags.FlagEnvironment.Defaults
  alias RailswitchBackend.FlagsGenerator
  alias RailswitchBackend.Orgs.Errors.NotOrganizationMember
  alias RailswitchBackend.OrgsGenerator

  setup do
    user = generate(AccountsGenerator.user())
    org = generate(OrgsGenerator.organization(actor: user))
    project = generate(FlagsGenerator.project(tenant: org.id))
    environment = generate(FlagsGenerator.environment(tenant: org.id, project_id: project.id))
    outsider = generate(AccountsGenerator.user())

    %{
      user: user,
      org: org,
      project: project,
      environment: environment,
      outsider: outsider
    }
  end

  describe "list_flags" do
    setup :with_flag

    test "returns the organization's flags to a member", ctx do
      assert {:ok, flags} = Flags.list_flags(tenant: ctx.org.id, actor: ctx.user)
      assert Enum.any?(flags, &(&1.id == ctx.flag.id))
    end

    test "policy - an outsider is refused", ctx do
      assert {:error, %Forbidden{errors: [%NotOrganizationMember{}]}} =
               Flags.list_flags(tenant: ctx.org.id, actor: ctx.outsider)
    end

    test "policy - a request without an actor is refused", ctx do
      assert {:error, %Forbidden{errors: [%NotOrganizationMember{}]}} =
               Flags.list_flags(tenant: ctx.org.id)
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
                 Flags.list_flags(tenant: ctx.org.id, actor: invitee)
      end
    end
  end

  describe "get_flag_by_project_and_flag_name" do
    setup :with_flag

    test "returns the matching flag to a member", ctx do
      assert {:ok, found_flag} =
               Flags.get_flag_by_project_and_flag_name(
                 %{project_name: ctx.project.name, flag_name: ctx.flag.name},
                 tenant: ctx.org.id,
                 actor: ctx.user
               )

      assert found_flag.id == ctx.flag.id
    end

    test "policy - an outsider is refused", ctx do
      assert {:error, %Forbidden{errors: [%NotOrganizationMember{}]}} =
               Flags.get_flag_by_project_and_flag_name(
                 %{project_name: ctx.project.name, flag_name: ctx.flag.name},
                 tenant: ctx.org.id,
                 actor: ctx.outsider
               )
    end

    test "policy - a request without an actor is refused", ctx do
      assert {:error, %Forbidden{errors: [%NotOrganizationMember{}]}} =
               Flags.get_flag_by_project_and_flag_name(
                 %{project_name: ctx.project.name, flag_name: ctx.flag.name},
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
                 Flags.get_flag_by_project_and_flag_name(
                   %{project_name: ctx.project.name, flag_name: ctx.flag.name},
                   tenant: ctx.org.id,
                   actor: invitee
                 )
      end
    end
  end

  describe "create_flag" do
    test "creates the flag for a member, auto-creating its flag environments", ctx do
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

    test "policy - an outsider is refused", ctx do
      assert {:error, %Forbidden{}} =
               Flags.create_flag(%{name: "checkout", project_id: ctx.project.id},
                 tenant: ctx.org.id,
                 actor: ctx.outsider
               )

      assert {:ok, []} = Flags.list_flags(tenant: ctx.org.id, actor: ctx.user)
    end

    test "policy - a request without an actor is refused", ctx do
      assert {:error, %Forbidden{}} =
               Flags.create_flag(%{name: "checkout", project_id: ctx.project.id},
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
                 Flags.create_flag(%{name: "checkout", project_id: ctx.project.id},
                   tenant: ctx.org.id,
                   actor: invitee
                 )

        assert {:ok, []} = Flags.list_flags(tenant: ctx.org.id, actor: ctx.user)
      end
    end
  end

  describe "delete_flag" do
    setup :with_flag

    test "deletes the flag for a member", ctx do
      assert :ok = Flags.delete_flag(ctx.flag, tenant: ctx.org.id, actor: ctx.user)
    end

    test "policy - an outsider is refused", ctx do
      assert {:error, %Forbidden{}} =
               Flags.delete_flag(ctx.flag, tenant: ctx.org.id, actor: ctx.outsider)
    end

    test "policy - a request without an actor is refused", ctx do
      assert {:error, %Forbidden{}} =
               Flags.delete_flag(ctx.flag, tenant: ctx.org.id)
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
                 Flags.delete_flag(ctx.flag, tenant: ctx.org.id, actor: invitee)
      end
    end
  end

  defp with_flag(ctx) do
    %{flag: generate(FlagsGenerator.flag(tenant: ctx.org.id, project_id: ctx.project.id))}
  end
end
