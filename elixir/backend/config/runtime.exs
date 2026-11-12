import Config

# config/runtime.exs is executed for all environments, including
# during releases. It is executed after compilation and before the
# system starts, so it is typically used to load production configuration
# and secrets from environment variables or elsewhere. Do not define
# any compile-time configuration in here, as it won't be applied.
# The block below contains prod specific runtime configuration.

# ## Using releases
#
# If you use `mix release`, you need to explicitly enable the server
# by passing the PHX_SERVER=true when you start it:
#
#     PHX_SERVER=true bin/railswitch_backend start
#
# Alternatively, you can use `mix phx.gen.release` to generate a `bin/server`
# script that automatically sets the env var above.
if System.get_env("PHX_SERVER") do
  config :railswitch_backend, RailswitchBackendWeb.Endpoint, server: true
end

# Instance settings from the environment
config :railswitch_backend, RailswitchBackend.Instance.Settings.EnvironmentSource,
  signups_enabled: System.get_env("SIGNUPS_ENABLED", "true") in ~w(true 1)

config :railswitch_backend, RailswitchBackendWeb.Endpoint, http: [port: String.to_integer(System.get_env("PORT", "4000"))]

config :sentry,
  dsn: System.get_env("SENTRY_DSN"),
  environment_name: config_env(),
  enable_source_code_context: true,
  root_source_code_paths: [File.cwd!()]

if config_env() == :prod do
  database_url =
    System.get_env("DATABASE_URL") ||
      raise """
      environment variable DATABASE_URL is missing.
      For example: ecto://USER:PASS@HOST/DATABASE
      """

  maybe_ipv6 = if System.get_env("ECTO_IPV6") in ~w(true 1), do: [:inet6], else: []

  # The secret key base is used to sign/encrypt cookies and other secrets.
  # A default value is used in config/dev.exs and config/test.exs but you
  # want to use a different value for prod and you most likely don't want
  # to check this value into version control, so we use an environment
  # variable instead.
  secret_key_base =
    System.get_env("SECRET_KEY_BASE") ||
      raise """
      environment variable SECRET_KEY_BASE is missing.
      You can generate one by calling: mix phx.gen.secret
      """

  host =
    System.get_env("PHX_HOST") ||
      raise "Missing environment variable `PHX_HOST`!"

  cors_origins =
    "CORS_ORIGINS"
    |> System.get_env("")
    |> String.split(",")
    |> Enum.map(&String.trim/1)
    |> Enum.reject(&(&1 == ""))
    |> case do
      [] -> raise "Missing environment variable `CORS_ORIGINS`!"
      origins -> origins
    end

  smtp_host =
    System.get_env("SMTP_HOST") ||
      raise "Missing environment variable `SMTP_HOST`!"

  smtp_port =
    case System.get_env("SMTP_PORT", "") do
      "" -> 587
      port -> String.to_integer(port)
    end

  smtp_implicit_tls? = smtp_port == 465
  smtp_username = System.get_env("SMTP_USERNAME", "")

  smtp_tls_options = [
    verify: :verify_peer,
    cacerts: :public_key.cacerts_get(),
    server_name_indication: String.to_charlist(smtp_host),
    customize_hostname_check: [match_fun: :public_key.pkix_verify_hostname_match_fun(:https)],
    depth: 99
  ]

  config :railswitch_backend, RailswitchBackend.Mailer,
    adapter: Swoosh.Adapters.SMTP,
    from_address:
      System.get_env("MAIL_FROM") ||
        raise("Missing environment variable `MAIL_FROM`!"),
    relay: smtp_host,
    port: smtp_port,
    username: smtp_username,
    password: System.get_env("SMTP_PASSWORD"),
    auth: if(smtp_username == "", do: :never, else: :always),
    ssl: smtp_implicit_tls?,
    tls: if(smtp_implicit_tls?, do: :never, else: :always),
    tls_options: smtp_tls_options,
    sockopts: if(smtp_implicit_tls?, do: smtp_tls_options, else: [])

  config :railswitch_backend, RailswitchBackend.Repo,
    # ssl: true,
    url: database_url,
    pool_size: String.to_integer(System.get_env("POOL_SIZE") || "10"),
    # For machines with several cores, consider starting multiple pools of `pool_size`
    # pool_count: 4,
    socket_options: maybe_ipv6

  config :railswitch_backend, RailswitchBackendWeb.Endpoint,
    url: [host: host, port: 443, scheme: "https"],
    check_origin: cors_origins,
    http: [
      # Enable IPv6 and bind on all interfaces.
      # Set it to  {0, 0, 0, 0, 0, 0, 0, 1} for local network only access.
      # See the documentation on https://hexdocs.pm/bandit/Bandit.html#t:options/0
      # for details about using IPv6 vs IPv4 and loopback vs public addresses.
      ip: {0, 0, 0, 0, 0, 0, 0, 0}
    ],
    secret_key_base: secret_key_base

  config :railswitch_backend, :dns_cluster_query, System.get_env("DNS_CLUSTER_QUERY")

  config :railswitch_backend,
    token_signing_secret:
      System.get_env("TOKEN_SIGNING_SECRET") ||
        raise("Missing environment variable `TOKEN_SIGNING_SECRET`!"),
    secure_cookies: true,
    cors_origins: cors_origins

  # ## SSL Support
  #
  # To get SSL working, you will need to add the `https` key
  # to your endpoint configuration:
  #
  #     config :railswitch_backend, RailswitchBackendWeb.Endpoint,
  #       https: [
  #         ...,
  #         port: 443,
  #         cipher_suite: :strong,
  #         keyfile: System.get_env("SOME_APP_SSL_KEY_PATH"),
  #         certfile: System.get_env("SOME_APP_SSL_CERT_PATH")
  #       ]
  #
  # The `cipher_suite` is set to `:strong` to support only the
  # latest and more secure SSL ciphers. This means old browsers
  # and clients may not be supported. You can set it to
  # `:compatible` for wider support.
  #
  # `:keyfile` and `:certfile` expect an absolute path to the key
  # and cert in disk or a relative path inside priv, for example
  # "priv/ssl/server.key". For all supported SSL configuration
  # options, see https://hexdocs.pm/plug/Plug.SSL.html#configure/1
  #
  # We also recommend setting `force_ssl` in your config/prod.exs,
  # ensuring no data is ever sent via http, always redirecting to https:
  #
  #     config :railswitch_backend, RailswitchBackendWeb.Endpoint,
  #       force_ssl: [hsts: true]
  #
  # Check `Plug.SSL` for all available options in `force_ssl`.
end
