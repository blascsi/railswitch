defmodule RailswitchBackendWeb.SdkSocket do
  @moduledoc """
  Websocket entry point for SDK clients.

  Clients authenticate with an environment API key (`api_key` param) —
  connections without a valid key are refused. The key identifies exactly one
  environment, from which the SDK should receive it's updates. The socket id is keyed by
  the API key id so that destroying the key disconnects every client that
  connected with it (see the `pub_sub` block on
  `RailswitchBackend.Flags.EnvironmentApiKey`).
  """

  use Phoenix.Socket

  alias AshAuthentication.Info
  alias AshAuthentication.Strategy
  alias RailswitchBackend.Flags.Environment

  channel "environment", RailswitchBackendWeb.EnvironmentChannel

  @impl true
  def connect(%{"api_key" => api_key}, socket, _connect_info) do
    strategy = Info.strategy!(Environment, :environment_api_key)

    case Strategy.action(strategy, :sign_in, %{api_key: api_key}) do
      {:ok, environment} ->
        {:ok,
         assign(socket,
           environment_id: environment.id,
           organization_id: environment.organization_id,
           api_key_id: environment.__metadata__.api_key.id
         )}

      {:error, _reason} ->
        :error
    end
  end

  def connect(_params, _socket, _connect_info), do: :error

  @impl true
  def id(socket), do: "api_key:#{socket.assigns.api_key_id}"
end
