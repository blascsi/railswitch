defmodule RailswitchBackend.Flags.Project do
  @moduledoc false
  use Ash.Resource,
    otp_app: :railswitch_backend,
    domain: RailswitchBackend.Flags,
    extensions: [AshGraphql.Resource, AshAuthentication],
    data_layer: AshPostgres.DataLayer,
    authorizers: [Ash.Policy.Authorizer]

  graphql do
    type :project
  end

  authentication do
    strategies do
      api_key :project_api_key do
        api_key_relationship :valid_api_keys
        multitenancy_relationship :organization
      end
    end
  end

  postgres do
    table "projects"
    repo RailswitchBackend.Repo

    references do
      reference :organization, on_delete: :delete
    end
  end

  actions do
    defaults [:read]

    destroy :destroy do
      primary? true
      require_atomic? false

      # Destroyed through Ash rather than by the Postgres cascades, because only
      # an Ash destroy fires the pub_sub notifications the SDK channel listens
      # for: `flags:<project_id>`, `environments:<id>` and the `api_key:<id>`
      # disconnect. `after_action?: false` runs them before the project row is
      # deleted, so they happen ahead of the DB cascade rather than after it.
      change cascade_destroy(:environments, after_action?: false, return_notifications?: true)
      change cascade_destroy(:flags, after_action?: false, return_notifications?: true)
      change cascade_destroy(:valid_api_keys, after_action?: false, return_notifications?: true)
    end

    create :create do
      primary? true
      accept [:name]
    end

    read :sign_in_with_project_api_key do
      argument :api_key, :string, allow_nil?: false

      # `:allow_global` because callers don't know the tenant before signing
      # in — the SignInPreparation resolves it from the API key's organization
      # (the strategy's `multitenancy_relationship`) and sets it mid-query.
      multitenancy :allow_global

      prepare AshAuthentication.Strategy.ApiKey.SignInPreparation
    end
  end

  policies do
    bypass always() do
      authorize_if AshAuthentication.Checks.AshAuthenticationInteraction
    end

    policy always() do
      description "Only members of the owning organization can act on projects"
      authorize_if expr(exists(organization.memberships, user_id == ^actor(:id)))
    end
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
    belongs_to :organization, RailswitchBackend.Orgs.Organization do
      allow_nil? false
      public? true
    end

    has_many :environments, RailswitchBackend.Flags.Environment do
      public? true
    end

    has_many :flags, RailswitchBackend.Flags.Flag do
      public? true
    end

    has_many :valid_api_keys, RailswitchBackend.Flags.ProjectApiKey
  end

  identities do
    identity :unique_name, :name
  end
end
