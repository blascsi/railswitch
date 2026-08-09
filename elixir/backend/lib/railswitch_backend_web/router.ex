defmodule RailswitchBackendWeb.Router do
  use RailswitchBackendWeb, :router

  import AshAuthentication.Plug.Helpers, only: [retrieve_from_bearer: 2, set_actor: 2]

  pipeline :graphql do
    plug RailswitchBackendWeb.Plugs.AuthCookieToBearer
    plug :bearer_to_user
    plug RailswitchBackendWeb.Plugs.RememberMe
    plug :user_to_actor
    plug RailswitchBackendWeb.Plugs.RequireSession
    plug RailswitchBackendWeb.Plugs.SetTenant
    plug AshGraphql.Plug
  end

  scope "/gql" do
    pipe_through [:graphql]

    if Application.compile_env(:railswitch_backend, :dev_routes) do
      forward "/playground", Absinthe.Plug.GraphiQL,
        schema: Module.concat(["RailswitchBackendWeb.GraphqlSchema"]),
        socket: Module.concat(["RailswitchBackendWeb.GraphqlSocket"]),
        interface: :simple,
        before_send: {RailswitchBackendWeb.GraphqlAuth, :before_send}
    end

    forward "/", Absinthe.Plug,
      schema: Module.concat(["RailswitchBackendWeb.GraphqlSchema"]),
      before_send: {RailswitchBackendWeb.GraphqlAuth, :before_send}
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
