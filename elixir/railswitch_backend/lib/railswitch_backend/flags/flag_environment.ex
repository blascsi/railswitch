defmodule RailswitchBackend.Flags.FlagEnvironment do
  @moduledoc false
  use Ash.Resource,
    otp_app: :railswitch_backend,
    domain: RailswitchBackend.Flags,
    extensions: [AshJsonApi.Resource],
    data_layer: AshPostgres.DataLayer

  json_api do
    type "flag_environment"
  end

  postgres do
    table "flag_environments"
    repo RailswitchBackend.Repo

    references do
      reference :organization, on_delete: :delete
      reference :flag, on_delete: :delete
      reference :environment, on_delete: :delete
    end
  end

  actions do
    defaults [:read, :create, :update, :destroy]
  end

  multitenancy do
    strategy :attribute
    attribute :organization_id
  end

  attributes do
    uuid_v7_primary_key :id

    attribute :rules, :map do
      allow_nil? false
      public? true
    end
  end

  relationships do
    belongs_to :organization, RailswitchBackend.Orgs.Organization do
      allow_nil? false
    end

    belongs_to :flag, RailswitchBackend.Flags.Flag do
      allow_nil? false
      public? true
    end

    belongs_to :environment, RailswitchBackend.Flags.Environment do
      allow_nil? false
      public? true
    end
  end

  identities do
    identity :flag_environment_key, [:environment_id, :flag_id]
  end
end
