defmodule ConveyorBackend.Orgs.Organization do
  @moduledoc false

  use Ash.Resource,
    otp_app: :conveyor_backend,
    domain: ConveyorBackend.Orgs,
    authorizers: [Ash.Policy.Authorizer],
    extensions: [AshJsonApi.Resource],
    data_layer: AshPostgres.DataLayer

  alias ConveyorBackend.Orgs.Membership

  json_api do
    type "organization"
  end

  postgres do
    table "organizations"
    repo ConveyorBackend.Repo
  end

  actions do
    defaults [:read]

    create :create do
      primary? true
      accept [:name]

      # Create a membership for the owner immediately
      change ConveyorBackend.Orgs.Organization.Changes.AddOwnerMembership
    end

    update :update do
      primary? true
      accept [:name]
    end

    destroy :destroy do
      primary? true
    end
  end

  policies do
    policy action_type(:create) do
      authorize_if actor_present()
    end

    policy action_type(:read) do
      authorize_if expr(exists(memberships, user_id == ^actor(:id)))
    end

    policy action_type([:update, :destroy]) do
      authorize_if expr(exists(memberships, user_id == ^actor(:id) and role == :owner))
    end
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
    has_many :memberships, Membership

    many_to_many :users, ConveyorBackend.Accounts.User do
      through Membership
      source_attribute_on_join_resource :organization_id
      destination_attribute_on_join_resource :user_id
    end
  end
end
