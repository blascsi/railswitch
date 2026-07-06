defmodule RailswitchBackendWeb.EnvironmentChannel do
  @moduledoc """
  Streams flag state to SDK clients for a single environment.

  Clients join `"environment:<name>"`; the name is resolved strictly within
  the authenticated socket's project and organization, so the topic string can
  never address another tenant's data. The join reply carries the full flag
  state; afterwards the channel forwards changes from the UUID-keyed internal
  PubSub topics published by the Flags resources.

  Never `Endpoint.broadcast` on `environment:*` topics — they are not
  tenant-unique. All fan-out stays on the internal topics.
  """

  use RailswitchBackendWeb, :channel

  alias Phoenix.Socket.Broadcast
  alias RailswitchBackend.Flags

  @impl true
  def join("environment:" <> name, _payload, socket) do
    %{project_id: project_id, organization_id: organization_id} = socket.assigns

    case Flags.get_environment_by_name(project_id, name, tenant: organization_id) do
      {:ok, environment} ->
        subscribe_to_internal_topics(environment, project_id)

        {:ok, %{flags: initial_state(environment, organization_id)}, socket}

      {:error, _not_found} ->
        {:error, %{reason: "environment not found"}}
    end
  end

  # Internal-topic notifications (see the pub_sub blocks on the Flags
  # resources). Payloads are raw %Ash.Notifier.Notification{} structs; events
  # are the Ash action names ("create"/"update"/"destroy").

  @impl true
  def handle_info(%Broadcast{topic: "flag_environments:" <> _, event: event, payload: notification}, socket)
      when event in ["create", "update"] do
    sdk_event = if event == "create", do: "flag_created", else: "flag_updated"
    flag_environment = notification.data

    with_flag_name(socket, flag_environment.flag_id, fn name ->
      push(socket, sdk_event, %{flag: name, rules: flag_environment.rules})
    end)

    {:noreply, socket}
  end

  def handle_info(%Broadcast{topic: "flag_environments:" <> _, event: "destroy", payload: notification}, socket) do
    with_flag_name(socket, notification.data.flag_id, fn name ->
      push(socket, "flag_deleted", %{flag: name})
    end)

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

  # FlagEnvironment notifications carry flag_id but not the flag name the SDK
  # wire format speaks in. If the flag is already gone (deletion race), the
  # event is dropped — the client still receives flag_deleted via the
  # flags:<project_id> topic, which supersedes it.
  defp with_flag_name(socket, flag_id, fun) do
    case Flags.get_flag_by_id(flag_id, tenant: socket.assigns.organization_id) do
      {:ok, flag} -> fun.(flag.name)
      {:error, _not_found} -> :ok
    end
  end

  defp subscribe_to_internal_topics(environment, project_id) do
    for topic <- [
          "flag_environments:#{environment.id}",
          "flags:#{project_id}",
          "environments:#{environment.id}"
        ] do
      :ok = Phoenix.PubSub.subscribe(RailswitchBackend.PubSub, topic)
    end
  end

  defp initial_state(environment, organization_id) do
    [
      query: [filter: [environment_id: environment.id]],
      load: :flag,
      tenant: organization_id
    ]
    |> Flags.list_flag_environments!()
    |> Map.new(fn flag_environment -> {flag_environment.flag.name, flag_environment.rules} end)
  end
end
