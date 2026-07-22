defmodule RailswitchBackendWeb.Router do
  use RailswitchBackendWeb, :router

  import AshAuthentication.Plug.Helpers, only: [retrieve_from_bearer: 2, set_actor: 2]

  pipeline :api do
    plug :accepts, ["json"]
    plug RailswitchBackendWeb.Plugs.AuthCookieToBearer
    plug :bearer_to_user
    plug RailswitchBackendWeb.Plugs.RememberMe
    plug :user_to_actor
    plug RailswitchBackendWeb.Plugs.SetTenant
    plug RailswitchBackendWeb.Plugs.TokensToCookies
  end

  scope "/api/json" do
    pipe_through [:api]

    forward "/swaggerui", OpenApiSpex.Plug.SwaggerUI,
      path: "/api/json/open_api",
      default_model_expand_depth: 4

    forward "/", RailswitchBackendWeb.AshJsonApiRouter
  end

  scope "/api", RailswitchBackendWeb do
    pipe_through :api
  end

  # Enable Swoosh mailbox preview in development
  if Application.compile_env(:railswitch_backend, :dev_routes) do
    scope "/dev" do
      pipe_through [:fetch_session, :protect_from_forgery]

      forward "/mailbox", Plug.Swoosh.MailboxPreview
    end
  end

  defp bearer_to_user(conn, _opts), do: retrieve_from_bearer(conn, :railswitch_backend)
  defp user_to_actor(conn, _opts), do: set_actor(conn, :user)
end
