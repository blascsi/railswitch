defmodule ConveyorBackendWeb.AshJsonApiRouter do
  use AshJsonApi.Router,
    domains: [ConveyorBackend.Accounts, ConveyorBackend.Orgs],
    open_api: "/open_api",
    open_api_title: "Conveyor API",
    modify_open_api: {ConveyorBackendWeb.OpenApi, :modify, []}
end
