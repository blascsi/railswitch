defmodule RailswitchBackendWeb.Plugs.SetTenant do
  @moduledoc """
  Sets the Ash tenant from the `x-organization-id` header.

  A malformed header value cannot identify any organization, so it is
  ignored and the request proceeds without a tenant — tenant-requiring
  actions then fail with the regular `tenant_not_provided` GraphQL error
  instead of a non-GraphQL 400 response.

  This plug does not do any verification to see if the actor
  actually has access to the tenant, the tenant's policies
  should be responsible for that.
  """

  @behaviour Plug

  import Plug.Conn

  @impl true
  def init(opts), do: opts

  @impl true
  def call(conn, _opts) do
    with [org_id | _] <- get_req_header(conn, "x-organization-id"),
         {:ok, id} <- Ecto.UUID.cast(org_id) do
      Ash.PlugHelpers.set_tenant(conn, id)
    else
      _ -> conn
    end
  end
end
