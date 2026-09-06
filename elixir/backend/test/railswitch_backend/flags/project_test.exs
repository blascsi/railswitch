defmodule RailswitchBackend.Flags.ProjectTest do
  @moduledoc """
  Action tests for `RailswitchBackend.Flags.Project`.
  """
  use RailswitchBackend.DataCase, async: true

  import Ash.Generator

  alias Ash.Error.Forbidden
  alias RailswitchBackend.AccountsGenerator
  alias RailswitchBackend.Flags
  alias RailswitchBackend.Orgs.Errors.NotOrganizationMember
  alias RailswitchBackend.OrgsGenerator

  setup do
    user = generate(AccountsGenerator.user())
    org = generate(OrgsGenerator.organization(actor: user))
    outsider = generate(AccountsGenerator.user())

    %{user: user, org: org, outsider: outsider}
  end

  describe "create" do
    test "a member of the organization can create a project", ctx do
      project = Flags.create_project!(%{name: "checkout"}, tenant: ctx.org.id, actor: ctx.user)

      assert to_string(project.name) == "checkout"
      assert project.organization_id == ctx.org.id
    end

    test "an outsider cannot create a project", ctx do
      assert {:error, %Forbidden{}} =
               Flags.create_project(%{name: "checkout"}, tenant: ctx.org.id, actor: ctx.outsider)
    end

    test "a request without an actor cannot create a project", ctx do
      assert {:error, %Forbidden{}} =
               Flags.create_project(%{name: "checkout"}, tenant: ctx.org.id)
    end
  end

  describe "read" do
    test "a member of the organization can read projects", ctx do
      project = Flags.create_project!(%{name: "checkout"}, tenant: ctx.org.id, actor: ctx.user)

      assert {:ok, projects} = Flags.list_projects(tenant: ctx.org.id, actor: ctx.user)
      assert Enum.any?(projects, &(&1.id == project.id))
    end

    test "an outsider cannot read projects", ctx do
      Flags.create_project!(%{name: "checkout"}, tenant: ctx.org.id, actor: ctx.user)

      assert {:error, %Forbidden{errors: [%NotOrganizationMember{}]}} =
               Flags.list_projects(tenant: ctx.org.id, actor: ctx.outsider)
    end

    test "a request without an actor cannot read projects", ctx do
      Flags.create_project!(%{name: "checkout"}, tenant: ctx.org.id, actor: ctx.user)

      assert {:error, %Forbidden{errors: [%NotOrganizationMember{}]}} =
               Flags.list_projects(tenant: ctx.org.id)
    end

    test "get_project_by_org_id_and_name returns the correct project", ctx do
      project = Flags.create_project!(%{name: "checkout"}, tenant: ctx.org.id, actor: ctx.user)

      assert {:ok, found_project} =
               Flags.get_project_by_org_id_and_name(project.name,
                 tenant: ctx.org.id,
                 actor: ctx.user
               )

      assert found_project.id == project.id
    end

    test "get_project_by_org_id_and_name does not return the project to an outsider", ctx do
      project = Flags.create_project!(%{name: "checkout"}, tenant: ctx.org.id, actor: ctx.user)

      assert {:error, %Forbidden{errors: [%NotOrganizationMember{}]}} =
               Flags.get_project_by_org_id_and_name(project.name,
                 tenant: ctx.org.id,
                 actor: ctx.outsider
               )
    end

    test "get_project_by_org_id_and_name does not return the project to a query without an actor",
         ctx do
      project = Flags.create_project!(%{name: "checkout"}, tenant: ctx.org.id, actor: ctx.user)

      assert {:error, %Forbidden{errors: [%NotOrganizationMember{}]}} =
               Flags.get_project_by_org_id_and_name(project.name,
                 tenant: ctx.org.id
               )
    end
  end

  describe "destroy" do
    test "a member of the organization can destroy a project", ctx do
      project = Flags.create_project!(%{name: "checkout"}, tenant: ctx.org.id, actor: ctx.user)

      assert :ok = Flags.delete_project(project, tenant: ctx.org.id, actor: ctx.user)
    end

    test "an outsider cannot destroy a project", ctx do
      project = Flags.create_project!(%{name: "checkout"}, tenant: ctx.org.id, actor: ctx.user)

      assert {:error, %Forbidden{}} =
               Flags.delete_project(project, tenant: ctx.org.id, actor: ctx.outsider)
    end

    test "a request without an actor cannot destroy a project", ctx do
      project = Flags.create_project!(%{name: "checkout"}, tenant: ctx.org.id, actor: ctx.user)

      assert {:error, %Forbidden{}} =
               Flags.delete_project(project, tenant: ctx.org.id)
    end
  end
end
