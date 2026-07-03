defmodule RailswitchBackend.Flags.ApiKeyTest do
  @moduledoc """
  Action tests for `RailswitchBackend.Flags.ProjectApiKey`.
  """
  use RailswitchBackend.DataCase, async: true

  import Ash.Generator

  alias RailswitchBackend.AccountsGenerator
  alias RailswitchBackend.Flags
  alias RailswitchBackend.FlagsGenerator
  alias RailswitchBackend.Orgs

  setup do
    user = generate(AccountsGenerator.user())
    org = Orgs.create_organization!("Api Key Test Org", actor: user)
    project = generate(FlagsGenerator.project(tenant: org.id))

    %{org: org, project: project}
  end

  describe "create" do
    test "sets the organization from the tenant and returns the plaintext key", ctx do
      api_key =
        Flags.create_api_key!(%{project_id: ctx.project.id},
          tenant: ctx.org.id,
          authorize?: false
        )

      assert api_key.organization_id == ctx.org.id
      assert api_key.project_id == ctx.project.id
      assert String.starts_with?(api_key.__metadata__.plaintext_api_key, "railswitch_")
    end
  end

  describe "destroy" do
    test "deletes the api key", ctx do
      api_key =
        Flags.create_api_key!(%{project_id: ctx.project.id},
          tenant: ctx.org.id,
          authorize?: false
        )

      assert :ok = Flags.delete_api_key!(api_key, tenant: ctx.org.id, authorize?: false)

      assert {:error, %Ash.Error.Invalid{errors: [%Ash.Error.Query.NotFound{}]}} =
               Flags.get_api_key_by_id(api_key.id, tenant: ctx.org.id, authorize?: false)
    end
  end
end
