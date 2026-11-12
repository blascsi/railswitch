defmodule RailswitchBackendWeb.HealthController do
  use RailswitchBackendWeb, :controller

  def show(conn, _params), do: text(conn, "ok")
end
