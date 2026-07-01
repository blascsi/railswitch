defmodule RailswitchBackend.Flags do
  @moduledoc false
  use Ash.Domain, otp_app: :railswitch_backend, extensions: [AshJsonApi.Domain]

  resources do
    resource RailswitchBackend.Flags.Project
  end
end
