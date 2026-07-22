defmodule RailswitchBackendWeb.SdkSocket do
  @moduledoc """
  Websocket entry point for SDK clients.

  Clients authenticate with a project API key (`api_key` param) — connections
  without a valid key are refused. The socket id is keyed by the API key id so
  that destroying the key disconnects every client that connected with it (see
  the `pub_sub` block on `RailswitchBackend.Flags.ProjectApiKey`).
  """

  use Phoenix.Socket

  alias AshAuthentication.Info
  alias AshAuthentication.Strategy
  alias RailswitchBackend.Flags.Project

  channel "environment:*", RailswitchBackendWeb.EnvironmentChannel

  @impl true
  def connect(%{"api_key" => api_key}, socket, _connect_info) do
    strategy = Info.strategy!(Project, :project_api_key)

    case Strategy.action(strategy, :sign_in, %{api_key: api_key}) do
      {:ok, project} ->
        {:ok,
         assign(socket,
           project_id: project.id,
           organization_id: project.organization_id,
           api_key_id: project.__metadata__.api_key.id
         )}

      {:error, _reason} ->
        :error
    end
  end

  def connect(_params, _socket, _connect_info), do: :error

  @impl true
  def id(socket), do: "api_key:#{socket.assigns.api_key_id}"
end
