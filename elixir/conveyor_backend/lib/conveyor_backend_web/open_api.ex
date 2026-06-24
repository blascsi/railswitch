defmodule ConveyorBackendWeb.OpenApi do
  @moduledoc false

  alias OpenApiSpex.Components
  alias OpenApiSpex.MediaType
  alias OpenApiSpex.Parameter
  alias OpenApiSpex.Reference
  alias OpenApiSpex.Response
  alias OpenApiSpex.Schema
  alias OpenApiSpex.SecurityScheme

  @operations [:get, :put, :post, :delete, :options, :head, :patch, :trace]

  def modify(spec, _conn, _opts) do
    spec
    |> put_version()
    |> put_security_schemes()
    |> document_tenant_header()
  end

  defp put_version(spec) do
    %{spec | info: %{spec.info | version: app_version()}}
  end

  defp put_security_schemes(spec) do
    schemes = %{
      "cookieAuth" => %SecurityScheme{
        type: "apiKey",
        in: "cookie",
        name: "conveyor_token",
        description: "Set automatically on /users/register and /users/sign-in."
      },
      "bearerAuth" => %SecurityScheme{
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "The same JWT, for non-browser clients."
      }
    }

    %{
      spec
      | components: %{(spec.components || %Components{}) | securitySchemes: schemes},
        security: [%{"cookieAuth" => []}, %{"bearerAuth" => []}]
    }
  end

  defp document_tenant_header(spec) do
    types = tenant_aware_types()
    paths = Map.new(spec.paths, fn {path, item} -> {path, document_path_item(item, types)} end)
    %{spec | paths: paths}
  end

  defp tenant_aware_types do
    for domain <- Application.get_env(:conveyor_backend, :ash_domains, []),
        resource <- Ash.Domain.Info.resources(domain),
        Ash.Resource.Info.multitenancy_strategy(resource),
        into: MapSet.new() do
      AshJsonApi.Resource.Info.type(resource)
    end
  end

  defp document_path_item(item, types) do
    Enum.reduce(@operations, item, fn field, item ->
      case Map.get(item, field) do
        nil -> item
        operation -> Map.put(item, field, maybe_document_operation(operation, types))
      end
    end)
  end

  defp maybe_document_operation(operation, types) do
    if Enum.any?(operation.tags, &MapSet.member?(types, &1)) do
      document_operation(operation)
    else
      operation
    end
  end

  defp document_operation(operation) do
    %{
      operation
      | parameters: [tenant_header() | operation.parameters],
        responses: Map.put(operation.responses, 400, invalid_tenant_response())
    }
  end

  defp tenant_header do
    %Parameter{
      name: :"x-organization-id",
      in: :header,
      required: false,
      description:
        "Selects the organization (tenant) the request acts within. " <>
          "Must be the UUID of an organization the authenticated user belongs to. " <>
          "Omit to make an untenanted request.",
      schema: %Schema{type: :string, format: :uuid}
    }
  end

  defp invalid_tenant_response do
    %Response{
      description: "The x-organization-id header was present but not a valid UUID.",
      content: %{
        "application/vnd.api+json" => %MediaType{
          schema: %Reference{"$ref": "#/components/schemas/errors"}
        }
      }
    }
  end

  defp app_version do
    :conveyor_backend |> Application.spec(:vsn) |> to_string()
  end
end
