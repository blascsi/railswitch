defmodule ConveyorBackend.Application do
  # See https://hexdocs.pm/elixir/Application.html
  # for more information on OTP Applications
  @moduledoc false

  use Application

  @impl true
  def start(_type, _args) do
    children = [
      ConveyorBackendWeb.Telemetry,
      ConveyorBackend.Repo,
      {DNSCluster, query: Application.get_env(:conveyor_backend, :dns_cluster_query) || :ignore},
      {Oban,
       AshOban.config(
         Application.fetch_env!(:conveyor_backend, :ash_domains),
         Application.fetch_env!(:conveyor_backend, Oban)
       )},
      {Phoenix.PubSub, name: ConveyorBackend.PubSub},
      # Start a worker by calling: ConveyorBackend.Worker.start_link(arg)
      # {ConveyorBackend.Worker, arg},
      # Start to serve requests, typically the last entry
      ConveyorBackendWeb.Endpoint,
      {AshAuthentication.Supervisor, [otp_app: :conveyor_backend]}
    ]

    # See https://hexdocs.pm/elixir/Supervisor.html
    # for other strategies and supported options
    opts = [strategy: :one_for_one, name: ConveyorBackend.Supervisor]
    Supervisor.start_link(children, opts)
  end

  # Tell Phoenix to update the endpoint configuration
  # whenever the application is updated.
  @impl true
  def config_change(changed, _new, removed) do
    ConveyorBackendWeb.Endpoint.config_change(changed, removed)
    :ok
  end
end
