defmodule ConveyorBackend.Orgs.Membership do
  @moduledoc false

  use Ash.Resource,
    otp_app: :conveyor_backend,
    domain: ConveyorBackend.Orgs,
    authorizers: [Ash.Policy.Authorizer],
    extensions: [AshJsonApi.Resource],
    data_layer: AshPostgres.DataLayer

  json_api do
    type "membership"
  end

  postgres do
    table "memberships"
    repo ConveyorBackend.Repo

    references do
      reference :user, on_delete: :delete
      reference :organization, on_delete: :delete
    end
  end

  actions do
    defaults [:read]

    create :create do
      primary? true
      accept [:role, :user_id, :organization_id]
    end

    update :change_role do
      accept [:role]
    end

    destroy :destroy do
      primary? true
    end
  end

  policies do
    policy action_type(:read) do
      description "Members see all memberships in the org, and users always see their own memberships"
      authorize_if expr(user_id == ^actor(:id))
      authorize_if expr(exists(organization.memberships, user_id == ^actor(:id)))
    end

    policy action_type([:create, :update]) do
      description "Owners can manage memberships"

      authorize_if expr(exists(organization.memberships, user_id == ^actor(:id) and role == :owner))
    end

    policy action_type(:destroy) do
      description "Anyone can remove themselves from an Organization, and owners can remove anyone from an Organization"

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

    attribute :role, :atom do
      constraints one_of: [:owner, :member]
      default :member
      allow_nil? false
      public? true
    end

    timestamps()
  end

  relationships do
    belongs_to :user, ConveyorBackend.Accounts.User do
      allow_nil? false
    end

    belongs_to :organization, ConveyorBackend.Orgs.Organization do
      allow_nil? false
    end
  end

  identities do
    identity :unique_membership, [:user_id, :organization_id]
  end
end
