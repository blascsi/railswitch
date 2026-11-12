defmodule RailswitchBackendWeb.HealthControllerTest do
  use RailswitchBackendWeb.ConnCase, async: true

  test "GET /health responds with 200", %{conn: conn} do
    conn = get(conn, ~p"/health")

    assert response(conn, 200) == "ok"
  end
end
