defmodule RailswitchBackendWeb.EnvironmentChannelTest do
  use RailswitchBackendWeb.ChannelCase, async: true

  import Ash.Generator

  alias RailswitchBackend.AccountsGenerator
  alias RailswitchBackend.Flags
  alias RailswitchBackend.FlagsGenerator
  alias RailswitchBackend.OrgsGenerator
  alias RailswitchBackendWeb.SdkSocket

  setup do
    user = generate(AccountsGenerator.user())
    org = generate(OrgsGenerator.organization(actor: user))
    project = generate(FlagsGenerator.project(tenant: org.id))

    environment =
      generate(FlagsGenerator.environment(tenant: org.id, project_id: project.id, name: "production"))

    api_key = generate(FlagsGenerator.api_key(tenant: org.id, project_id: project.id))

    {:ok, socket} = connect(SdkSocket, %{"api_key" => api_key.__metadata__.plaintext_api_key})

    %{user: user, org: org, project: project, environment: environment, socket: socket}
  end

  defp create_flag!(ctx, name) do
    Flags.create_flag!(%{name: name, project_id: ctx.project.id},
      tenant: ctx.org.id,
      actor: ctx.user
    )
  end

  defp flag_environment!(ctx, flag) do
    [flag_environment] =
      Flags.list_flag_environments!(
        query: [filter: [environment_id: ctx.environment.id, flag_id: flag.id]],
        tenant: ctx.org.id,
        actor: ctx.user
      )

    flag_environment
  end

  describe "join" do
    test "replies with the environment's full flag state", ctx do
      flag = create_flag!(ctx, "checkout")
      flag_environment = flag_environment!(ctx, flag)

      Flags.update_flag_environment!(flag_environment, %{rules: %{"enabled" => true}},
        tenant: ctx.org.id,
        actor: ctx.user
      )

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
      other_org = generate(OrgsGenerator.organization(actor: other_user))
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

  describe "event forwarding" do
    setup ctx do
      {:ok, _reply, socket} = subscribe_and_join(ctx.socket, "environment:production")
      %{socket: socket}
    end

    test "pushes flag_created when a flag is created", ctx do
      create_flag!(ctx, "checkout")

      assert_push "flag_created", %{flag: "checkout", rules: %{}}
    end

    test "pushes flag_updated when a flag environment's rules change", ctx do
      flag = create_flag!(ctx, "checkout")
      flag_environment = flag_environment!(ctx, flag)

      Flags.update_flag_environment!(flag_environment, %{rules: %{"enabled" => true}},
        tenant: ctx.org.id,
        actor: ctx.user
      )

      assert_push "flag_updated", %{flag: "checkout", rules: %{"enabled" => true}}
    end

    test "pushes flag_deleted when a flag environment is destroyed", ctx do
      flag = create_flag!(ctx, "checkout")
      flag_environment = flag_environment!(ctx, flag)

      Flags.delete_flag_environment!(flag_environment, tenant: ctx.org.id, actor: ctx.user)

      assert_push "flag_deleted", %{flag: "checkout"}
    end

    test "pushes flag_deleted when the flag itself is destroyed", ctx do
      flag = create_flag!(ctx, "checkout")

      Flags.delete_flag!(flag, tenant: ctx.org.id, actor: ctx.user)

      assert_push "flag_deleted", %{flag: "checkout"}
    end

    test "does not push events from other environments", ctx do
      generate(
        FlagsGenerator.environment(
          tenant: ctx.org.id,
          project_id: ctx.project.id,
          name: "staging"
        )
      )

      flag = create_flag!(ctx, "checkout")
      assert_push "flag_created", %{flag: "checkout"}

      [staging_flag_environment] =
        [query: [filter: [flag_id: flag.id]], tenant: ctx.org.id, actor: ctx.user]
        |> Flags.list_flag_environments!()
        |> Enum.reject(&(&1.environment_id == ctx.environment.id))

      Flags.update_flag_environment!(staging_flag_environment, %{rules: %{"enabled" => true}},
        tenant: ctx.org.id,
        actor: ctx.user
      )

      refute_push "flag_updated", %{flag: "checkout"}
    end

    test "pushes environment_deleted and stops when the environment is destroyed", ctx do
      Process.flag(:trap_exit, true)
      ref = Process.monitor(ctx.socket.channel_pid)

      Flags.delete_environment!(ctx.environment, tenant: ctx.org.id, actor: ctx.user)

      assert_push "environment_deleted", %{}
      assert_receive {:DOWN, ^ref, :process, _pid, :shutdown}
    end
  end

  describe "unexpected messages" do
    setup ctx do
      {:ok, _reply, socket} = subscribe_and_join(ctx.socket, "environment:production")
      %{socket: socket}
    end

    test "ignores pushes from the client", ctx do
      push(ctx.socket, "unsupported", %{"some" => "payload"})

      create_flag!(ctx, "checkout")

      assert_push "flag_created", %{flag: "checkout"}
    end

    test "ignores internal events it does not forward", ctx do
      send(
        ctx.socket.channel_pid,
        %Phoenix.Socket.Broadcast{topic: "flags:#{ctx.project.id}", event: "update", payload: nil}
      )

      create_flag!(ctx, "checkout")

      assert_push "flag_created", %{flag: "checkout"}
    end
  end
end
