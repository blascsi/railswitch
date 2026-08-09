defmodule RailswitchBackendWeb.GraphqlSchema do
  @moduledoc false
  use Absinthe.Schema

  use AshGraphql,
    domains: [RailswitchBackend.Accounts, RailswitchBackend.Orgs, RailswitchBackend.Flags],
    generate_sdl_file: "generated/schema.graphql",
    auto_generate_sdl_file?: true

  query do
    # Custom Absinthe queries can be placed here
  end

  mutation do
    # Custom Absinthe mutations can be placed here
  end

  subscription do
    # Custom Absinthe subscriptions can be placed here
  end
end
