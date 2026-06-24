defmodule ConveyorBackendWeb.Cors do
  @moduledoc false

  def allowed_origin?(_conn, origin), do: origin in Application.get_env(:conveyor_backend, :cors_origins, [])
end
