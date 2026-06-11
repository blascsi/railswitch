defmodule ConveyorBackend.Orgs do
  @moduledoc false

  use Ash.Domain, otp_app: :conveyor_backend, extensions: [AshJsonApi.Domain]

  alias ConveyorBackend.Orgs.Membership
  alias ConveyorBackend.Orgs.Organization

  json_api do
    routes do
      base_route "/organizations", Organization do
        index :read
        get :read
        post :create
        patch :update
        delete :destroy
      end

      base_route "/memberships", Membership do
        index :read
        post :create
        patch :change_role
        delete :destroy
      end
    end
  end

  resources do
    resource Organization do
      define :create_organization, action: :create, args: [:name]
      define :get_organization, action: :read, get_by: [:id]
      define :list_organizations, action: :read
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
