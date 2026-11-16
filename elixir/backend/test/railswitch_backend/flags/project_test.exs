defmodule RailswitchBackend.Flags.ProjectTest do
  @moduledoc """
  Action tests for `RailswitchBackend.Flags.Project`.
  """
  use RailswitchBackend.DataCase, async: true

  import Ash.Generator

  alias Ash.Error.Forbidden
  alias RailswitchBackend.AccountsGenerator
  alias RailswitchBackend.Flags
  alias RailswitchBackend.FlagsGenerator
  alias RailswitchBackend.Orgs.Errors.NotOrganizationMember
  alias RailswitchBackend.OrgsGenerator

  setup do
    user = generate(AccountsGenerator.user())
    org = generate(OrgsGenerator.organization(actor: user))
    outsider = generate(AccountsGenerator.user())

    %{
      user: user,
      org: org,
      outsider: outsider
    }
  end

  describe "list_projects" do
    setup :with_project

    test "returns the organization's projects to a member", ctx do
      assert {:ok, projects} = Flags.list_projects(tenant: ctx.org.id, actor: ctx.user)
      assert Enum.any?(projects, &(&1.id == ctx.project.id))
    end

    test "policy - an outsider is refused", ctx do
      assert {:error, %Forbidden{errors: [%NotOrganizationMember{}]}} =
               Flags.list_projects(tenant: ctx.org.id, actor: ctx.outsider)
    end

    test "policy - a request without an actor is refused", ctx do
      assert {:error, %Forbidden{errors: [%NotOrganizationMember{}]}} =
               Flags.list_projects(tenant: ctx.org.id)
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
                 Flags.list_projects(tenant: ctx.org.id, actor: invitee)
      end
    end
  end

  describe "get_project_by_org_id_and_name" do
    setup :with_project

    test "returns the matching project to a member", ctx do
      assert {:ok, found_project} =
               Flags.get_project_by_org_id_and_name(ctx.project.name,
                 tenant: ctx.org.id,
                 actor: ctx.user
               )

      assert found_project.id == ctx.project.id
    end

    test "policy - an outsider is refused", ctx do
      assert {:error, %Forbidden{errors: [%NotOrganizationMember{}]}} =
               Flags.get_project_by_org_id_and_name(ctx.project.name,
                 tenant: ctx.org.id,
                 actor: ctx.outsider
               )
    end

    test "policy - a request without an actor is refused", ctx do
      assert {:error, %Forbidden{errors: [%NotOrganizationMember{}]}} =
               Flags.get_project_by_org_id_and_name(ctx.project.name,
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
                 Flags.get_project_by_org_id_and_name(ctx.project.name,
                   tenant: ctx.org.id,
                   actor: invitee
                 )
      end
    end
  end

  describe "create_project" do
    test "creates the project in the tenant organization for a member", ctx do
      project = Flags.create_project!(%{name: "checkout"}, tenant: ctx.org.id, actor: ctx.user)

      assert to_string(project.name) == "checkout"
      assert project.organization_id == ctx.org.id
    end

    test "policy - an outsider is refused", ctx do
      assert {:error, %Forbidden{}} =
               Flags.create_project(%{name: "checkout"}, tenant: ctx.org.id, actor: ctx.outsider)
    end

    test "policy - a request without an actor is refused", ctx do
      assert {:error, %Forbidden{}} =
               Flags.create_project(%{name: "checkout"}, tenant: ctx.org.id)
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
                 Flags.create_project(%{name: "checkout"}, tenant: ctx.org.id, actor: invitee)
      end
    end
  end

  describe "delete_project" do
    setup :with_project

    test "deletes the project for a member", ctx do
      assert :ok = Flags.delete_project(ctx.project, tenant: ctx.org.id, actor: ctx.user)
    end

    test "policy - an outsider is refused", ctx do
      assert {:error, %Forbidden{}} =
               Flags.delete_project(ctx.project, tenant: ctx.org.id, actor: ctx.outsider)
    end

    test "policy - a request without an actor is refused", ctx do
      assert {:error, %Forbidden{}} =
               Flags.delete_project(ctx.project, tenant: ctx.org.id)
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
                 Flags.delete_project(ctx.project, tenant: ctx.org.id, actor: invitee)
      end
    end
  end

  defp with_project(ctx) do
    %{project: generate(FlagsGenerator.project(tenant: ctx.org.id))}
  end
end
