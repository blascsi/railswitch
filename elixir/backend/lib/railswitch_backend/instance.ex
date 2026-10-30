defmodule RailswitchBackend.Instance do
  @moduledoc false
  use Ash.Domain,
    otp_app: :railswitch_backend,
    extensions: [AshGraphql.Domain]

  alias RailswitchBackend.Instance.Settings

  graphql do
    queries do
      action Settings, :instance_settings, :current
    end
  end

  resources do
    resource Settings do
      define :current_settings, action: :current
    end
  end
end
