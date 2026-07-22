defmodule RailswitchBackend.Application do
  # See https://hexdocs.pm/elixir/Application.html
  # for more information on OTP Applications
  @moduledoc false

  use Application

  @impl true
  def start(_type, _args) do
    children = [
      RailswitchBackendWeb.Telemetry,
      RailswitchBackend.Repo,
      {DNSCluster, query: Application.get_env(:railswitch_backend, :dns_cluster_query) || :ignore},
      {Oban,
       AshOban.config(
         Application.fetch_env!(:railswitch_backend, :ash_domains),
         Application.fetch_env!(:railswitch_backend, Oban)
       )},
      {Phoenix.PubSub, name: RailswitchBackend.PubSub},
      # Start a worker by calling: RailswitchBackend.Worker.start_link(arg)
      # {RailswitchBackend.Worker, arg},
      # Start to serve requests, typically the last entry
      RailswitchBackendWeb.Endpoint,
      {AshAuthentication.Supervisor, [otp_app: :railswitch_backend]}
    ]

    # See https://hexdocs.pm/elixir/Supervisor.html
    # for other strategies and supported options
    opts = [strategy: :one_for_one, name: RailswitchBackend.Supervisor]
    Supervisor.start_link(children, opts)
  end

  # Tell Phoenix to update the endpoint configuration
  # whenever the application is updated.
  @impl true
  def config_change(changed, _new, removed) do
    RailswitchBackendWeb.Endpoint.config_change(changed, removed)
    :ok
  end
end
