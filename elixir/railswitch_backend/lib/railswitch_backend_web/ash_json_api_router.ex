defmodule RailswitchBackendWeb.AshJsonApiRouter do
  use AshJsonApi.Router,
    domains: [RailswitchBackend.Accounts, RailswitchBackend.Orgs],
    open_api: "/open_api",
    open_api_title: "Railswitch API",
    modify_open_api: {RailswitchBackendWeb.OpenApi, :modify, []}
end
