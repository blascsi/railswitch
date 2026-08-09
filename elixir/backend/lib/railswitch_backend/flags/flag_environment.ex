defmodule RailswitchBackend.Flags.FlagEnvironment do
  @moduledoc false
  use Ash.Resource,
    otp_app: :railswitch_backend,
    domain: RailswitchBackend.Flags,
    extensions: [AshGraphql.Resource],
    data_layer: AshPostgres.DataLayer,
    authorizers: [Ash.Policy.Authorizer],
    notifiers: [Ash.Notifier.PubSub]

  graphql do
    type :flag_environment
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
    defaults [:read, :destroy]

    create :create do
      accept [:rules]

      argument :flag_id, :uuid, allow_nil?: false
      argument :environment_id, :uuid, allow_nil?: false

      change set_attribute(:flag_id, arg(:flag_id))
      change set_attribute(:environment_id, arg(:environment_id))
    end

    update :update do
      accept [:rules]
    end
  end

  policies do
    policy always() do
      description "Only members of the owning organization can act on flag environments"
      authorize_if expr(exists(organization.memberships, user_id == ^actor(:id)))
    end
  end

  pub_sub do
    module RailswitchBackendWeb.Endpoint
    prefix "flag_environments"

    publish :create, [:environment_id]
    publish :update, [:environment_id]
    publish :destroy, [:environment_id]
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
