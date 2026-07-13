defmodule RailswitchBackend.Flags do
  @moduledoc false
  use Ash.Domain, otp_app: :railswitch_backend, extensions: [AshJsonApi.Domain]

  alias RailswitchBackend.Flags.Environment
  alias RailswitchBackend.Flags.Flag
  alias RailswitchBackend.Flags.Project

  json_api do
    routes do
      base_route "/projects", Project do
        get :read
        index :read
        post :create
        patch :update
        delete :destroy
      end

      base_route "/environments", Environment do
        get :read
        index :read
        post :create
        delete :destroy
      end

      base_route "/flags", Flag do
        get :read
        index :read
        post :create
        delete :destroy
      end
    end
  end

  resources do
    resource Project do
      define :list_projects, action: :read
      define :create_project, action: :create
      define :update_project, action: :update
      define :delete_project, action: :destroy
    end

    resource Flag do
      define :list_flags, action: :read
      define :get_flag_by_id, action: :read, get_by: :id
      define :create_flag, action: :create
      define :delete_flag, action: :destroy
    end

    resource Environment do
      define :list_environments, action: :read
      define :get_environment_by_name, action: :read, get_by_identity: :unique_name
      define :create_environment, action: :create
      define :delete_environment, action: :destroy
    end

    resource RailswitchBackend.Flags.FlagEnvironment do
      define :list_flag_environments, action: :read
      define :create_flag_environment, action: :create
      define :update_flag_environment, action: :update
      define :delete_flag_environment, action: :destroy
    end

    resource RailswitchBackend.Flags.ProjectApiKey do
      define :get_api_key_by_id, action: :read, get_by: :id
      define :create_api_key, action: :create
      define :delete_api_key, action: :destroy
    end
  end
end
