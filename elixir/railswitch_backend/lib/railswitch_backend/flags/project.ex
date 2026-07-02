defmodule RailswitchBackend.Flags.Project do
  @moduledoc false
  use Ash.Resource,
    otp_app: :railswitch_backend,
    domain: RailswitchBackend.Flags,
    extensions: [AshJsonApi.Resource, AshAuthentication],
    data_layer: AshPostgres.DataLayer

  authentication do
    strategies do
      api_key :project_api_key do
        api_key_relationship :valid_api_keys
        multitenancy_relationship :organization
      end
    end
  end

  json_api do
    type "project"
  end

  postgres do
    table "projects"
    repo RailswitchBackend.Repo

    references do
      reference :organization, on_delete: :delete
    end
  end

  actions do
    defaults [:read, :destroy]

    create :create do
      primary? true
      accept [:name]
    end

    update :update do
      primary? true
      accept [:name]
    end

    read :sign_in_with_project_api_key do
      argument :api_key, :string, allow_nil?: false
      prepare AshAuthentication.Strategy.ApiKey.SignInPreparation
    end
  end

  multitenancy do
    strategy :attribute
    attribute :organization_id
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
    belongs_to :organization, RailswitchBackend.Orgs.Organization do
      allow_nil? false
      public? true
    end

    has_many :valid_api_keys, RailswitchBackend.Flags.ProjectApiKey
  end
end
