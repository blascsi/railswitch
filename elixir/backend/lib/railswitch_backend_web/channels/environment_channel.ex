defmodule RailswitchBackendWeb.EnvironmentChannel do
  @moduledoc """
  Streams flag state to SDK clients for a single environment.

  The topic is the constant `"environment"`: the API key resolved one
  environment during the socket handshake, so the client never names one and
  cannot address another tenant's data. The join reply carries the full flag
  state; afterwards the channel forwards changes from the UUID-keyed internal
  PubSub topics published by the Flags resources.

  Never `Endpoint.broadcast` on the `"environment"` topic — every client shares
  it. All fan-out stays on the internal topics.
  """

  use RailswitchBackendWeb, :channel

  alias Phoenix.Socket.Broadcast
  alias RailswitchBackend.Flags

  # The API-key handshake on SdkSocket is the authorization here; every read
  # is scoped by the authenticated socket assigns.
  @impl true
  def join("environment", _payload, socket) do
    %{environment_id: environment_id, organization_id: organization_id} = socket.assigns

    case Flags.get_environment_by_id(environment_id, tenant: organization_id, authorize?: false) do
      {:ok, environment} ->
        subscribe_to_internal_topics(environment)
        {:ok, %{flags: initial_state(environment, organization_id)}, socket}

      {:error, _not_found} ->
        {:error, %{reason: "environment not found"}}
    end
  end

  # SDK clients only listen; pushes are ignored rather than crashing the
  # channel.
  @impl true
  def handle_in(_event, _payload, socket), do: {:noreply, socket}

  # Internal-topic notifications (see the pub_sub blocks on the Flags
  # resources). Payloads are raw %Ash.Notifier.Notification{} structs; events
  # are the Ash action names ("create"/"update"/"destroy").

  @impl true
  def handle_info(%Broadcast{topic: "flag_environments:" <> _, event: event, payload: notification}, socket)
      when event in ["create", "update"] do
    sdk_event = if event == "create", do: "flag_created", else: "flag_updated"
    flag_environment = notification.data

    push(socket, sdk_event, %{flag: flag_environment.flag_name, rules: flag_environment.rules})
    {:noreply, socket}
  end

  def handle_info(%Broadcast{topic: "flags:" <> _, event: "destroy", payload: notification}, socket) do
    push(socket, "flag_deleted", %{flag: notification.data.name})
    {:noreply, socket}
  end

  def handle_info(%Broadcast{topic: "environments:" <> _, event: "destroy"}, socket) do
    push(socket, "environment_deleted", %{})
    {:stop, :shutdown, socket}
  end

  # Events the SDK wire format doesn't speak (e.g. a publish added to a
  # subscribed topic later) are ignored rather than crashing the channel.
  def handle_info(_message, socket), do: {:noreply, socket}

  defp subscribe_to_internal_topics(environment) do
    for topic <- [
          "flag_environments:#{environment.id}",
          "flags:#{environment.project_id}",
          "environments:#{environment.id}"
        ] do
      :ok = Phoenix.PubSub.subscribe(RailswitchBackend.PubSub, topic)
    end
  end

  defp initial_state(environment, organization_id) do
    [
      query: [filter: [environment_id: environment.id]],
      load: :flag_name,
      tenant: organization_id,
      authorize?: false
    ]
    |> Flags.list_flag_environments!()
    |> Map.new(fn flag_environment -> {flag_environment.flag_name, flag_environment.rules} end)
  end
end
