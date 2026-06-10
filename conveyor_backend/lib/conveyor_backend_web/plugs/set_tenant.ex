defmodule ConveyorBackendWeb.Plugs.SetTenant do
  @moduledoc """
  Sets the Ash tenant from the `x-organization-id` header.

  This plug does not do any verification to see if the actor
  actually has access to the tenant, the tenant's poilicies
  should be responsible for that.
  """

  @behaviour Plug

  import Plug.Conn

  @impl true
  def init(opts), do: opts

  @impl true
  def call(conn, _opts) do
    case get_req_header(conn, "x-organization-id") do
      [] ->
        conn

      [org_id | _] ->
        case Ecto.UUID.cast(org_id) do
          {:ok, id} ->
            Ash.PlugHelpers.set_tenant(conn, id)

          :error ->
            conn
            |> put_resp_content_type("application/vnd.api+json")
            |> send_resp(400, ~s({"errors":[{"detail":"invalid x-organization-id"}]}))
            |> halt()
        end
    end
  end
end
