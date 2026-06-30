import Config

config :ash, policies: [show_policy_breakdowns?: true], disable_async?: true

config :bcrypt_elixir, log_rounds: 1

# Print only warnings and errors during test
config :logger, level: :warning

# Initialize plugs at runtime for faster test compilation
config :phoenix, :plug_init_mode, :runtime

# Sort query params output of verified routes for robust url comparisons
config :phoenix,
  sort_verified_routes_query_params: true

config :railswitch_backend, Oban, testing: :manual

# In test we don't send emails
config :railswitch_backend, RailswitchBackend.Mailer, adapter: Swoosh.Adapters.Test

# Configure your database
#
# The MIX_TEST_PARTITION environment variable can be used
# to provide built-in test partitioning in CI environment.
# Run `mix help test` for more information.
config :railswitch_backend, RailswitchBackend.Repo,
  username: System.get_env("POSTGRES_USER", "postgres"),
  password: System.get_env("POSTGRES_PASSWORD", "postgres"),
  hostname: System.get_env("POSTGRES_HOST", "localhost"),
  database:
    System.get_env(
      "POSTGRES_DB",
      "railswitch_backend_test#{System.get_env("MIX_TEST_PARTITION")}"
    ),
  pool: Ecto.Adapters.SQL.Sandbox,
  pool_size: System.schedulers_online() * 2

# We don't run a server during test. If one is required,
# you can enable the server option below.
config :railswitch_backend, RailswitchBackendWeb.Endpoint,
  http: [ip: {127, 0, 0, 1}, port: 4002],
  secret_key_base: "NSdjry96tzYyCSD6fQM9y7kbB6xOoyajeR89UbqCMcXq9ZDa+InbJLlxxS2upcCl",
  server: false

config :railswitch_backend, token_signing_secret: "Tnu+ESsqnCGW98aX7n4xXqEqe3w9O7oH"

# Disable swoosh api client as it is only required for production adapters
config :swoosh, :api_client, false
