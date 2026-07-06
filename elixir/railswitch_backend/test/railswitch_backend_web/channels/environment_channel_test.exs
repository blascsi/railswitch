defmodule RailswitchBackendWeb.EnvironmentChannelTest do
  use RailswitchBackendWeb.ChannelCase, async: true

  import Ash.Generator

  alias RailswitchBackend.AccountsGenerator
  alias RailswitchBackend.Flags
  alias RailswitchBackend.FlagsGenerator
  alias RailswitchBackend.Orgs
  alias RailswitchBackendWeb.SdkSocket

  setup do
    user = generate(AccountsGenerator.user())
    org = Orgs.create_organization!("Environment Channel Test Org", actor: user)
    project = generate(FlagsGenerator.project(tenant: org.id))

    environment =
      generate(FlagsGenerator.environment(tenant: org.id, project_id: project.id, name: "production"))

    api_key = generate(FlagsGenerator.api_key(tenant: org.id, project_id: project.id))

    {:ok, socket} = connect(SdkSocket, %{"api_key" => api_key.__metadata__.plaintext_api_key})

    %{user: user, org: org, project: project, environment: environment, socket: socket}
  end

  defp create_flag!(ctx, name) do
    Flags.create_flag!(%{name: name, project_id: ctx.project.id}, tenant: ctx.org.id)
  end

  defp flag_environment!(ctx, flag) do
    [flag_environment] =
      Flags.list_flag_environments!(
        query: [filter: [environment_id: ctx.environment.id, flag_id: flag.id]],
        tenant: ctx.org.id
      )

    flag_environment
  end

  describe "join" do
    test "replies with the environment's full flag state", ctx do
      flag = create_flag!(ctx, "checkout")
      flag_environment = flag_environment!(ctx, flag)

      Flags.update_flag_environments!(flag_environment, %{rules: %{"enabled" => true}}, tenant: ctx.org.id)

      create_flag!(ctx, "search")

      assert {:ok, reply, _socket} = subscribe_and_join(ctx.socket, "environment:production")

      assert reply == %{flags: %{"checkout" => %{"enabled" => true}, "search" => %{}}}
    end

    test "replies with an empty flag map when the project has no flags", ctx do
      assert {:ok, %{flags: %{}}, _socket} =
               subscribe_and_join(ctx.socket, "environment:production")
    end

    test "refuses to join an unknown environment", ctx do
      assert {:error, %{reason: "environment not found"}} =
               subscribe_and_join(ctx.socket, "environment:staging")
    end

    test "refuses to join an environment that exists only in another project", ctx do
      other_project = generate(FlagsGenerator.project(tenant: ctx.org.id))

      generate(
        FlagsGenerator.environment(
          tenant: ctx.org.id,
          project_id: other_project.id,
          name: "staging"
        )
      )

      assert {:error, %{reason: "environment not found"}} =
               subscribe_and_join(ctx.socket, "environment:staging")
    end

    test "refuses to join an environment of a project in another organization", ctx do
      other_user = generate(AccountsGenerator.user())
      other_org = Orgs.create_organization!("Other Org", actor: other_user)
      other_project = generate(FlagsGenerator.project(tenant: other_org.id))

      generate(
        FlagsGenerator.environment(
          tenant: other_org.id,
          project_id: other_project.id,
          name: "staging"
        )
      )

      assert {:error, %{reason: "environment not found"}} =
               subscribe_and_join(ctx.socket, "environment:staging")
    end
  end
end
