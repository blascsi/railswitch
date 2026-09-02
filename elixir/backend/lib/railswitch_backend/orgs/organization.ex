defmodule RailswitchBackend.Orgs.Organization do
  @moduledoc false

  use Ash.Resource,
    otp_app: :railswitch_backend,
    domain: RailswitchBackend.Orgs,
    authorizers: [Ash.Policy.Authorizer],
    extensions: [AshGraphql.Resource],
    data_layer: AshPostgres.DataLayer

  alias RailswitchBackend.Orgs.Membership

  graphql do
    type :organization
  end

  postgres do
    table "organizations"
    repo RailswitchBackend.Repo
  end

  actions do
    defaults [:read]

    create :create do
      primary? true
      accept [:name]

      # Create a membership for the owner immediately
      change RailswitchBackend.Orgs.Organization.Changes.AddOwnerMembership
    end

    update :update do
      primary? true
      accept [:name]
    end

    destroy :destroy do
      primary? true
      require_atomic? false

      # Projects need to be destroyed through Ash, so we can run notifications on them
      change RailswitchBackend.Orgs.Organization.Changes.DestroyProjects
    end
  end

  policies do
    policy action_type(:create) do
      description "Any signed-in user can create an organization"
      authorize_if actor_present()
    end

    policy action_type(:read) do
      description "Members of an organization can read it"
      authorize_if expr(exists(memberships, user_id == ^actor(:id)))
    end

    policy action_type([:update, :destroy]) do
      description "Only owners can update or delete an organization"
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

    has_many :projects, RailswitchBackend.Flags.Project

    many_to_many :users, RailswitchBackend.Accounts.User do
      through Membership
      source_attribute_on_join_resource :organization_id
      destination_attribute_on_join_resource :user_id
    end
  end
end
