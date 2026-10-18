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
  alias RailswitchBackend.Orgs.Membership.Types.Role
  alias RailswitchBackend.Orgs.Validations.ArgumentIsTenant

  @system_actions [:create]

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

    action :invite do
      argument :email, :ci_string, allow_nil?: false

      argument :role, Role,
        allow_nil?: false,
        default: :member

      run RailswitchBackend.Orgs.Membership.Actions.Invite
    end

    create :create do
      primary? true
      accept [:role, :status]

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
    policy action(@system_actions) do
      description "System actions are forbidden to call by users"
      forbid_if always()
    end

    policy action_type(:read) do
      description "Users see their own memberships, accepted members see the org's accepted memberships"
      forbid_unless ActorInTenant
      authorize_if expr(user_id == ^actor(:id))

      authorize_if expr(
                     status == :accepted and
                       exists(organization.accepted_memberships, user_id == ^actor(:id))
                   )
    end

    policy action(:invite) do
      description "Accepted owners can invite users to their organization"
      forbid_unless ActorInTenant
      authorize_if RailswitchBackend.Orgs.Checks.ActorOwnsTenant
    end

    policy action(:change_role) do
      description "Owners can change the role of accepted members"
      forbid_unless ActorInTenant

      authorize_if expr(
                     status == :accepted and
                       exists(
                         organization.accepted_memberships,
                         user_id == ^actor(:id) and role == :owner
                       )
                   )
    end

    policy action_type(:destroy) do
      description "Accepted members can leave, and owners can remove accepted members"
      forbid_unless ActorInTenant
      authorize_if expr(status == :accepted and user_id == ^actor(:id))

      authorize_if expr(
                     status == :accepted and
                       exists(
                         organization.accepted_memberships,
                         user_id == ^actor(:id) and role == :owner
                       )
                   )
    end
  end

  multitenancy do
    strategy :attribute
    attribute :organization_id
    global? true
  end

  attributes do
    uuid_v7_primary_key :id

    attribute :role, Role do
      default :member
      allow_nil? false
      public? true
    end

    attribute :status, RailswitchBackend.Orgs.Membership.Types.Status do
      default :pending
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
