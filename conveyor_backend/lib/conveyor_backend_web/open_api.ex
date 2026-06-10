# lib/conveyor_web/open_api.ex
defmodule ConveyorBackendWeb.OpenApi do
  @moduledoc false

  alias OpenApiSpex.Components
  alias OpenApiSpex.SecurityScheme

  def modify(spec, _conn, _opts) do
    %{
      spec
      | info: %{spec.info | version: app_version()},
        components: %{
          (spec.components || %Components{})
          | securitySchemes: %{
              "cookieAuth" => %SecurityScheme{
                type: "apiKey",
                in: "cookie",
                name: "conveyor_token",
                description:
                  "Set automatically on /users/register and /users/sign-in. " <>
                    "Send x-organization-id to select the tenant."
              },
              "bearerAuth" => %SecurityScheme{
                type: "http",
                scheme: "bearer",
                bearerFormat: "JWT",
                description: "The same JWT, for non-browser clients."
              }
            }
        },
        security: [%{"cookieAuth" => []}, %{"bearerAuth" => []}]
    }
  end

  defp app_version do
    :conveyor_backend |> Application.spec(:vsn) |> to_string()
  end
end
