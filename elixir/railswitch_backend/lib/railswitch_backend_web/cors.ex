defmodule RailswitchBackendWeb.Cors do
  @moduledoc false

  def allowed_origin?(_conn, origin), do: origin in Application.get_env(:railswitch_backend, :cors_origins, [])
end
