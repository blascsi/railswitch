defmodule RailswitchBackend.Orgs do
  @moduledoc false

  use Ash.Domain, otp_app: :railswitch_backend, extensions: [AshGraphql.Domain]

  alias RailswitchBackend.Orgs.Membership
  alias RailswitchBackend.Orgs.Organization

  graphql do
    queries do
      get Organization, :get_organization, :read
      list Organization, :list_organizations, :read
      list Membership, :list_memberships, :read
    end

    mutations do
      create Organization, :create_organization, :create
      update Organization, :update_organization, :update
      destroy Organization, :delete_organization, :destroy

      create Membership, :add_member, :create
      update Membership, :change_member_role, :change_role
      destroy Membership, :remove_member, :destroy
    end
  end

  resources do
    resource Organization do
      define :create_organization, action: :create, args: [:name]
      define :get_organization, action: :read, get_by: [:id]
      define :list_organizations, action: :read
      define :update_organization, action: :update, args: [:name]
      define :delete_organization, action: :destroy
    end

    resource Membership do
      define :add_member, action: :create, args: [:organization_id, :user_id, :role]
      define :list_memberships, action: :read
      define :remove_member, action: :destroy
      define :change_member_role, action: :change_role, args: [:role]
    end
  end
end
