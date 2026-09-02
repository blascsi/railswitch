defmodule RailswitchBackend.Flags.Project do
  @moduledoc false
  use Ash.Resource,
    otp_app: :railswitch_backend,
    domain: RailswitchBackend.Flags,
    extensions: [AshGraphql.Resource],
    data_layer: AshPostgres.DataLayer,
    authorizers: [Ash.Policy.Authorizer]

  graphql do
    type :project
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
      # for: `flags:<project_id>` and `environments:<id>`, the latter cascading
      # on to its api keys. `after_action?: false` runs them before the project
      # row is deleted, so they happen ahead of the DB cascade rather than after.
      change cascade_destroy(:environments, after_action?: false, return_notifications?: true)
      change cascade_destroy(:flags, after_action?: false, return_notifications?: true)
    end

    create :create do
      primary? true
      accept [:name]
    end
  end

  policies do
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
  end

  identities do
    identity :unique_name, :name
  end
end
