defmodule RailswitchBackend.Flags do
  @moduledoc false
  use Ash.Domain, otp_app: :railswitch_backend, extensions: [AshGraphql.Domain]

  alias RailswitchBackend.Flags.Environment
  alias RailswitchBackend.Flags.EnvironmentApiKey
  alias RailswitchBackend.Flags.Flag
  alias RailswitchBackend.Flags.FlagEnvironment
  alias RailswitchBackend.Flags.Project

  graphql do
    queries do
      get Project, :get_project, :read
      get Project, :get_project_by_name, :read, identity: :unique_name
      list Project, :list_projects, :read

      get Flag, :get_flag, :read
      get Flag, :get_flag_by_name, :get_by_name, identity: false
      list Flag, :list_flags, :read

      get Environment, :get_environment, :read
      get Environment, :get_environment_by_name, :get_by_name, identity: false
      list Environment, :list_environments, :read

      get FlagEnvironment, :get_flag_environment, :read
      list FlagEnvironment, :list_flag_environments, :read

      get EnvironmentApiKey, :get_environment_api_key, :read
      list EnvironmentApiKey, :list_environment_api_keys, :read
    end

    mutations do
      create Project, :create_project, :create
      destroy Project, :delete_project, :destroy

      create Flag, :create_flag, :create
      destroy Flag, :delete_flag, :destroy

      create Environment, :create_environment, :create
      destroy Environment, :delete_environment, :destroy

      update FlagEnvironment, :update_flag_environment, :update

      create EnvironmentApiKey, :create_environment_api_key, :create
      destroy EnvironmentApiKey, :delete_environment_api_key, :destroy
    end
  end

  resources do
    resource Project do
      define :list_projects, action: :read
      define :get_project_by_org_id_and_name, action: :read, get_by_identity: :unique_name
      define :create_project, action: :create
      define :delete_project, action: :destroy
    end

    resource Flag do
      define :list_flags, action: :read
      define :get_flag_by_id, action: :read, get_by: :id
      define :get_flag_by_project_and_flag_name, action: :get_by_name
      define :create_flag, action: :create
      define :delete_flag, action: :destroy
    end

    resource Environment do
      define :list_environments, action: :read
      define :get_environment_by_project_id_and_name, action: :read, get_by_identity: :unique_name
      define :get_environment_by_id, action: :read, get_by: :id
      define :get_environment_by_project_and_environment_name, action: :get_by_name
      define :create_environment, action: :create
      define :delete_environment, action: :destroy
    end

    resource FlagEnvironment do
      define :list_flag_environments, action: :read
      define :update_flag_environment, action: :update
    end

    resource EnvironmentApiKey do
      define :list_environment_api_keys, action: :read
      define :get_environment_api_key_by_id, action: :read, get_by: :id
      define :create_environment_api_key, action: :create
      define :delete_environment_api_key, action: :destroy
    end
  end
end
