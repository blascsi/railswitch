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
