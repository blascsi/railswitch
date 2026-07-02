defmodule RailswitchBackend.Flags do
  @moduledoc false
  use Ash.Domain, otp_app: :railswitch_backend, extensions: [AshJsonApi.Domain]

  resources do
    resource Project do
      define :list_projects, action: :read
      define :create_project, action: :create
      define :update_project, action: :update
      define :delete_project, action: :destroy
    end

    resource Flag do
      define :list_flags, action: :read
      define :create_flag, action: :create
      define :delete_flag, action: :destroy
    end

    resource Environment do
      define :list_environments, action: :read
      define :create_environemnt, action: :create
      define :delete_environment, action: :destroy
    end

    resource RailswitchBackend.Flags.FlagEnvironment do
      define :list_flag_environments, action: :read
      define :create_flag_environments, action: :create
      define :update_flag_environments, action: :update
      define :delete_flag_environments, action: :destroy
    end
  end
end
