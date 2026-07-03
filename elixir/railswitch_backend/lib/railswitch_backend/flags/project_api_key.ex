defmodule RailswitchBackend.Flags.ProjectApiKey do
  @moduledoc false

  use Ash.Resource,
    otp_app: :railswitch_backend,
    domain: RailswitchBackend.Flags,
    data_layer: AshPostgres.DataLayer,
    authorizers: [Ash.Policy.Authorizer],
    notifiers: [Ash.Notifier.PubSub]

  postgres do
    table "project_api_keys"
    repo RailswitchBackend.Repo

    references do
      reference :project, on_delete: :delete
    end
  end

  actions do
    defaults [:read, :destroy]

    create :create do
      primary? true
      accept [:project_id]

      change {AshAuthentication.Strategy.ApiKey.GenerateApiKey, prefix: :railswitch, hash: :api_key_hash}
    end
  end

  policies do
    bypass always() do
      authorize_if AshAuthentication.Checks.AshAuthenticationInteraction
    end
  end

  pub_sub do
    module RailswitchBackendWeb.Endpoint
    prefix "api_key"

    publish :destroy, [:id], event: "disconnect"
  end

  # `global? true` because AshAuthentication's SignInPreparation must read the
  # api key without knowing the tenant (the key itself resolves the tenant via
  # the strategy's `multitenancy_relationship`). Creates still pass a tenant,
  # which populates `organization_id`.
  multitenancy do
    strategy :attribute
    attribute :organization_id
    global? true
  end

  attributes do
    uuid_primary_key :id

    attribute :api_key_hash, :binary do
      allow_nil? false
      sensitive? true
    end
  end

  relationships do
    belongs_to :organization, RailswitchBackend.Orgs.Organization do
      allow_nil? false
    end

    belongs_to :project, RailswitchBackend.Flags.Project do
      allow_nil? false
    end
  end

  identities do
    identity :unique_api_key, [:api_key_hash], all_tenants?: true
  end
end
