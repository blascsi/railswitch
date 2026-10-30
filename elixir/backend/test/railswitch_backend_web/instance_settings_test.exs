defmodule RailswitchBackendWeb.InstanceSettingsTest do
  @moduledoc """
  The instance settings exposed through the GraphQL API.
  """
  use RailswitchBackendWeb.ConnCase, async: true

  import RailswitchBackend.Instance.Settings.TestSource, only: [put_instance_setting: 2]

  @instance_settings_query """
  query {
    instanceSettings { signupsEnabled }
  }
  """

  describe "instanceSettings query" do
    test "is available without signing in", %{conn: conn} do
      assert %{"data" => %{"instanceSettings" => %{}}} =
               conn
               |> gql(@instance_settings_query)
               |> json()
    end

    test "reflects the configured settings", %{conn: conn} do
      put_instance_setting(:signups_enabled, false)

      assert %{"data" => %{"instanceSettings" => %{"signupsEnabled" => false}}} =
               conn |> gql(@instance_settings_query) |> json()

      put_instance_setting(:signups_enabled, true)

      assert %{"data" => %{"instanceSettings" => %{"signupsEnabled" => true}}} =
               conn |> gql(@instance_settings_query) |> json()
    end
  end

  defp gql(conn, query) do
    conn
    |> put_req_header("content-type", "application/json")
    |> post("/gql", Jason.encode!(%{"query" => query}))
  end

  defp json(conn) do
    assert conn.status == 200
    Jason.decode!(conn.resp_body)
  end
end
