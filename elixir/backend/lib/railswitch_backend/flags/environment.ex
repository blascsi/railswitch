defmodule RailswitchBackend.Flags.Environment do
  @moduledoc false
  use Ash.Resource,
    otp_app: :railswitch_backend,
    domain: RailswitchBackend.Flags,
    extensions: [AshGraphql.Resource, AshAuthentication],
    data_layer: AshPostgres.DataLayer,
    authorizers: [Ash.Policy.Authorizer],
    notifiers: [Ash.Notifier.PubSub]

  graphql do
    type :environment
  end

  authentication do
    strategies do
      api_key :environment_api_key do
        api_key_relationship :valid_api_keys
        multitenancy_relationship :organization
      end
    end
  end

  postgres do
    table "environments"
    repo RailswitchBackend.Repo

    references do
      reference :organization, on_delete: :delete
      reference :project, on_delete: :delete
    end
  end

  actions do
    defaults [:read]

    destroy :destroy do
      primary? true
      require_atomic? false

      # Destroyed through Ash rather than by the Postgres cascade, because only
      # an Ash destroy fires the `api_key:<id>` disconnect that drops the SDK
      # sockets authenticated with these keys.
      change cascade_destroy(:valid_api_keys, after_action?: false, return_notifications?: true)
    end

    read :sign_in_with_environment_api_key do
      argument :api_key, :string, allow_nil?: false

      # `:allow_global` because callers don't know the tenant before signing
      # in — the SignInPreparation resolves it from the API key's organization
      # (the strategy's `multitenancy_relationship`) and sets it mid-query.
      multitenancy :allow_global

      prepare AshAuthentication.Strategy.ApiKey.SignInPreparation
    end

    read :get_by_name do
      get? true

      argument :project_name, :string, allow_nil?: false
      argument :environment_name, :string, allow_nil?: false

      filter expr(
               name == ^arg(:environment_name) and
                 project.name == ^arg(:project_name)
             )
    end

    create :create do
      accept [:name]

      argument :project_id, :uuid, allow_nil?: false

      change set_attribute(:project_id, arg(:project_id))
      change {RailswitchBackend.Flags.Changes.CreateFlagEnvironments, type: :environment}
    end
  end

  policies do
    bypass always() do
      authorize_if AshAuthentication.Checks.AshAuthenticationInteraction
    end

    policy always() do
      description "Only members of the owning organization can act on environments"
      authorize_if expr(exists(organization.memberships, user_id == ^actor(:id)))
    end
  end

  pub_sub do
    module RailswitchBackendWeb.Endpoint
    prefix "environments"

    publish :destroy, [:id]
  end

  multitenancy do
    strategy :attribute
    attribute :organization_id
  end

  attributes do
    uuid_v7_primary_key :id

    attribute :name, :ci_string do
      allow_nil? false

      constraints casing: :lower,
                  trim?: true,
                  match: RailswitchBackend.AttributeRegexes.lowercase_letters_and_underscores()

      public? true
    end

    timestamps()
  end

  relationships do
    belongs_to :project, RailswitchBackend.Flags.Project do
      allow_nil? false
      public? true
    end

    belongs_to :organization, RailswitchBackend.Orgs.Organization do
      allow_nil? false
    end

    has_many :valid_api_keys, RailswitchBackend.Flags.EnvironmentApiKey do
      public? true
    end
  end

  identities do
    identity :unique_name, [:project_id, :name],
      field_names: [:name],
      message: "An environment with this name already exists in this project"
  end
end
