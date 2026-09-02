defmodule RailswitchBackend.Flags.EnvironmentApiKey do
  @moduledoc false

  use Ash.Resource,
    otp_app: :railswitch_backend,
    domain: RailswitchBackend.Flags,
    extensions: [AshGraphql.Resource],
    data_layer: AshPostgres.DataLayer,
    authorizers: [Ash.Policy.Authorizer],
    notifiers: [Ash.Notifier.PubSub]

  graphql do
    type :environment_api_key
  end

  postgres do
    table "environment_api_keys"
    repo RailswitchBackend.Repo

    references do
      reference :organization, on_delete: :delete
      reference :environment, on_delete: :delete
    end
  end

  actions do
    defaults [:read, :destroy]

    create :create do
      primary? true
      accept [:name, :environment_id]

      change {AshAuthentication.Strategy.ApiKey.GenerateApiKey, prefix: :railswitch, hash: :api_key_hash}

      metadata :plaintext_api_key, :string do
        description "The API key in plaintext. Only available on creation."
        allow_nil? false
      end
    end
  end

  policies do
    bypass always() do
      authorize_if AshAuthentication.Checks.AshAuthenticationInteraction
    end

    policy always() do
      description "Only members of the owning organization can act on api keys"
      authorize_if expr(exists(organization.memberships, user_id == ^actor(:id)))
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

    attribute :name, :ci_string do
      allow_nil? false
      public? true
    end

    attribute :api_key_hash, :binary do
      allow_nil? false
      sensitive? true
    end
  end

  relationships do
    belongs_to :organization, RailswitchBackend.Orgs.Organization do
      allow_nil? false
    end

    belongs_to :environment, RailswitchBackend.Flags.Environment do
      allow_nil? false
      public? true
    end
  end

  identities do
    identity :unique_api_key, [:api_key_hash], all_tenants?: true
  end
end
