import Config

# Do not print debug messages in production
config :logger, level: :info

# Force using SSL in production. This also sets the "strict-security-transport" header,
# known as HSTS. If you have a health check endpoint, you may want to exclude it below.
# Note `:force_ssl` is required to be set at compile-time.
config :railswitch_backend, RailswitchBackendWeb.Endpoint,
  force_ssl: [
    rewrite_on: [:x_forwarded_proto],
    exclude: [
      # paths: ["/health"],
      hosts: ["localhost", "127.0.0.1"]
    ]
  ]

# Configure Swoosh API Client
config :swoosh, api_client: Swoosh.ApiClient.Req

# Runtime production configuration, including reading

# Disable Swoosh Local Memory Storage
# of environment variables, is done on config/runtime.exs.
config :swoosh, local: false
