defmodule RailswitchBackend.Flags.Environment do
  @moduledoc false
  use Ash.Resource,
    otp_app: :railswitch_backend,
    domain: RailswitchBackend.Flags,
    extensions: [AshJsonApi.Resource],
    data_layer: AshPostgres.DataLayer,
    authorizers: [Ash.Policy.Authorizer],
    notifiers: [Ash.Notifier.PubSub]

  json_api do
    type "environment"
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
    defaults [:read, :destroy]

    create :create do
      accept [:name]

      argument :project_id, :uuid, allow_nil?: false

      validate {RailswitchBackend.Validations.LowercaseLettersAndUnderscoresAttribute, field: :name}

      change set_attribute(:project_id, arg(:project_id))
      change {RailswitchBackend.Flags.Changes.CreateFlagEnvironments, type: :environment}
    end
  end

  policies do
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

    attribute :name, :string do
      allow_nil? false
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
  end

  identities do
    identity :unique_name, [:project_id, :name]
  end
end
