defmodule RailswitchBackendWeb.SdkSocketTest do
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
      generate(FlagsGenerator.environment(tenant: org.id, project_id: project.id))

    api_key = generate(FlagsGenerator.api_key(tenant: org.id, environment_id: environment.id))

    %{
      user: user,
      org: org,
      environment: environment,
      api_key: api_key,
      plaintext_key: api_key.__metadata__.plaintext_api_key
    }
  end

  describe "connect/3" do
    test "connects with a valid API key and assigns the environment context", ctx do
      assert {:ok, socket} = connect(SdkSocket, %{"api_key" => ctx.plaintext_key})
      assert socket.assigns.environment_id == ctx.environment.id
      assert socket.assigns.organization_id == ctx.org.id
      assert socket.assigns.api_key_id == ctx.api_key.id
      refute Map.has_key?(socket.assigns, :project_id)
    end

    test "refuses connection without an API key" do
      assert :error = connect(SdkSocket, %{})
    end

    test "refuses connection with a garbage API key" do
      assert :error = connect(SdkSocket, %{"api_key" => "railswitch_not_a_real_key"})
    end

    test "refuses connection with a deleted API key", ctx do
      :ok = Flags.delete_environment_api_key!(ctx.api_key, tenant: ctx.org.id, actor: ctx.user)

      assert :error = connect(SdkSocket, %{"api_key" => ctx.plaintext_key})
    end
  end

  describe "id/1" do
    test "is keyed by the API key id so key deletion can force a disconnect", ctx do
      {:ok, socket} = connect(SdkSocket, %{"api_key" => ctx.plaintext_key})

      assert SdkSocket.id(socket) == "api_key:#{ctx.api_key.id}"
    end
  end
end
