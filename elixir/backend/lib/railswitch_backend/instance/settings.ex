defmodule RailswitchBackend.Instance.Settings do
  @moduledoc false
  use Ash.Resource,
    otp_app: :railswitch_backend,
    domain: RailswitchBackend.Instance,
    authorizers: [Ash.Policy.Authorizer],
    extensions: [AshGraphql.Resource]

  graphql do
    type :instance_settings
  end

  resource do
    require_primary_key? false
  end

  actions do
    action :current, :struct do
      constraints instance_of: __MODULE__

      run fn _input, _context ->
        source = Application.fetch_env!(:railswitch_backend, :instance_settings_source)
        {:ok, struct!(__MODULE__, source.values())}
      end
    end
  end

  policies do
    policy action(:current) do
      description "Instance settings are public"
      authorize_if always()
    end
  end

  attributes do
    attribute :signups_enabled, :boolean, allow_nil?: false, public?: true
  end
end
