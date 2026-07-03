defmodule RailswitchBackend.Flags.PubSubTest do
  @moduledoc """
  Tests for the Ash pub_sub notifier configuration on the Flags resources.

  These broadcasts are the internal topics consumed by the SDK websocket
  channels (and, for `api_key:<id>` / `"disconnect"`, by Phoenix socket
  transports directly).
  """
  use RailswitchBackend.DataCase, async: true

  import Ash.Generator

  alias Ash.Notifier.Notification
  alias Phoenix.Socket.Broadcast
  alias RailswitchBackend.AccountsGenerator
  alias RailswitchBackend.Flags
  alias RailswitchBackend.FlagsGenerator
  alias RailswitchBackend.Orgs

  setup do
    user = generate(AccountsGenerator.user())
    org = Orgs.create_organization!("PubSub Test Org", actor: user)
    project = generate(FlagsGenerator.project(tenant: org.id))

    environment =
      generate(FlagsGenerator.environment(tenant: org.id, project_id: project.id, name: "production"))

    %{org: org, project: project, environment: environment}
  end

  defp subscribe(topic), do: :ok = Phoenix.PubSub.subscribe(RailswitchBackend.PubSub, topic)

  defp create_flag!(ctx, name \\ "checkout") do
    Flags.create_flag!(%{name: name, project_id: ctx.project.id}, tenant: ctx.org.id)
  end

  defp flag_environment!(ctx) do
    [flag_environment] =
      Flags.list_flag_environments!(
        query: [filter: [environment_id: ctx.environment.id]],
        tenant: ctx.org.id
      )

    flag_environment
  end

  describe "FlagEnvironment publications" do
    test "creating a flag publishes create on the environment topic", ctx do
      subscribe("flag_environments:#{ctx.environment.id}")

      flag = create_flag!(ctx)
      flag_environment = flag_environment!(ctx)

      assert_receive %Broadcast{event: "create", payload: %Notification{data: data}}
      assert data.id == flag_environment.id
      assert data.flag_id == flag.id
      assert data.environment_id == ctx.environment.id
      assert data.rules == %{}
    end

    test "updating rules publishes update on the environment topic", ctx do
      _flag = create_flag!(ctx)
      flag_environment = flag_environment!(ctx)
      subscribe("flag_environments:#{ctx.environment.id}")

      Flags.update_flag_environments!(flag_environment, %{rules: %{"enabled" => true}}, tenant: ctx.org.id)

      assert_receive %Broadcast{event: "update", payload: %Notification{data: data}}
      assert data.id == flag_environment.id
      assert data.rules == %{"enabled" => true}
    end

    test "destroying a flag environment publishes destroy on the environment topic", ctx do
      create_flag!(ctx)
      flag_environment = flag_environment!(ctx)
      subscribe("flag_environments:#{ctx.environment.id}")

      Flags.delete_flag_environments!(flag_environment, tenant: ctx.org.id)

      assert_receive %Broadcast{event: "destroy", payload: %Notification{data: data}}
      assert data.id == flag_environment.id
    end
  end

  describe "Flag publications" do
    test "destroying a flag publishes destroy on the project topic", ctx do
      flag = create_flag!(ctx)
      subscribe("flags:#{ctx.project.id}")

      Flags.delete_flag!(flag, tenant: ctx.org.id)

      assert_receive %Broadcast{event: "destroy", payload: %Notification{data: data}}
      assert data.name == "checkout"
    end
  end

  describe "Environment publications" do
    test "destroying an environment publishes destroy on its topic", ctx do
      subscribe("environments:#{ctx.environment.id}")

      Flags.delete_environment!(ctx.environment, tenant: ctx.org.id)

      assert_receive %Broadcast{event: "destroy", payload: %Notification{}}
    end
  end

  describe "ProjectApiKey publications" do
    test "destroying an api key publishes disconnect on the socket id topic", ctx do
      api_key = generate(FlagsGenerator.api_key(tenant: ctx.org.id, project_id: ctx.project.id))
      subscribe("api_key:#{api_key.id}")

      Flags.delete_api_key!(api_key, tenant: ctx.org.id, authorize?: false)

      assert_receive %Broadcast{event: "disconnect"}
    end
  end
end
