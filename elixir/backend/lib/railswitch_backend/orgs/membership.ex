defmodule RailswitchBackend.Orgs.Membership do
  @moduledoc false

  use Ash.Resource,
    otp_app: :railswitch_backend,
    domain: RailswitchBackend.Orgs,
    authorizers: [Ash.Policy.Authorizer],
    extensions: [AshGraphql.Resource],
    data_layer: AshPostgres.DataLayer

  alias RailswitchBackend.Orgs.Checks.ActorInTenant
  alias RailswitchBackend.Orgs.Membership.Changes.EnsureRemainingOwner
  alias RailswitchBackend.Orgs.Validations.ArgumentIsTenant

  graphql do
    type :membership
  end

  postgres do
    table "memberships"
    repo RailswitchBackend.Repo

    references do
      reference :user, on_delete: :delete
      reference :organization, on_delete: :delete
    end
  end

  actions do
    defaults [:read]

    create :create do
      primary? true
      accept [:role]

      argument :user_id, :uuid, allow_nil?: false
      argument :organization_id, :uuid, allow_nil?: false

      validate {ArgumentIsTenant, arguments: [:organization_id]}

      change set_attribute(:user_id, arg(:user_id))
      change set_attribute(:organization_id, arg(:organization_id))
    end

    update :change_role do
      accept [:role]
      require_atomic? false

      change EnsureRemainingOwner
    end

    destroy :destroy do
      primary? true
      require_atomic? false

      change EnsureRemainingOwner
    end
  end

  policies do
    policy action_type(:read) do
      description "Members see all memberships in the org, and users always see their own memberships"
      forbid_unless ActorInTenant
      authorize_if expr(user_id == ^actor(:id))
      authorize_if expr(exists(organization.memberships, user_id == ^actor(:id)))
    end

    policy action_type([:create, :update]) do
      description "Owners can manage memberships"
      forbid_unless ActorInTenant

      authorize_if expr(exists(organization.memberships, user_id == ^actor(:id) and role == :owner))
    end

    policy action_type(:destroy) do
      description "Anyone can remove themselves from an Organization, and owners can remove anyone from an Organization"
      forbid_unless ActorInTenant

      authorize_if expr(user_id == ^actor(:id))

      authorize_if expr(exists(organization.memberships, user_id == ^actor(:id) and role == :owner))
    end
  end

  multitenancy do
    strategy :attribute
    attribute :organization_id
    global? true
  end

  attributes do
    uuid_v7_primary_key :id

    attribute :role, RailswitchBackend.Orgs.Membership.Types.Role do
      default :member
      allow_nil? false
      public? true
    end

    timestamps()
  end

  relationships do
    belongs_to :user, RailswitchBackend.Accounts.User do
      public? true
      allow_nil? false
    end

    belongs_to :organization, RailswitchBackend.Orgs.Organization do
      allow_nil? false
    end
  end

  identities do
    identity :unique_membership, [:user_id, :organization_id],
      field_names: [:user_id],
      message: "This user is already a member of this organization"
  end
end
