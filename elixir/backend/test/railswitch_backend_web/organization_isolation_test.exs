defmodule RailswitchBackendWeb.OrganizationIsolationTest do
  @moduledoc """
  Organization isolation, end to end through the GraphQL API.

  A request names the organization it acts in with the `x-organization-id`
  header. These tests cover the two halves of that boundary: the header itself,
  and the ids the request carries in its input — which land in that organization
  and so must belong to it.
  """
  use RailswitchBackendWeb.ConnCase, async: true
  use Ash.Generator

  alias Ash.Domain.Info
  alias RailswitchBackend.AccountsGenerator
  alias RailswitchBackend.Flags.EnvironmentApiKey
  alias RailswitchBackend.FlagsGenerator
  alias RailswitchBackend.Orgs.Membership
  alias RailswitchBackend.Orgs.Validations.ArgumentIsTenant
  alias RailswitchBackend.Orgs.Validations.RelationshipInTenant
  alias RailswitchBackend.OrgsGenerator
  alias RailswitchBackendWeb.SdkSocket

  require Ash.Query

  @create_environment_api_key """
  mutation CreateEnvironmentApiKey($name: String!, $environmentId: ID!) {
    createEnvironmentApiKey(input: {name: $name, environmentId: $environmentId}) {
      result { id }
      metadata { plaintextApiKey }
      errors { code message fields }
    }
  }
  """

  @create_flag """
  mutation CreateFlag($name: String!, $projectId: ID!) {
    createFlag(input: {name: $name, projectId: $projectId}) {
      result { id }
      errors { code message fields }
    }
  }
  """

  @create_environment """
  mutation CreateEnvironment($name: String!, $projectId: ID!) {
    createEnvironment(input: {name: $name, projectId: $projectId}) {
      result { id }
      errors { code message fields }
    }
  }
  """

  @add_member """
  mutation AddMember($userId: ID!, $organizationId: ID!) {
    addMember(input: {userId: $userId, organizationId: $organizationId, role: MEMBER}) {
      result { id }
      errors { code message fields }
    }
  }
  """

  @list_projects "query { listProjects { results { id } } }"

  setup do
    insider = generate(AccountsGenerator.user())
    ours = generate(OrgsGenerator.organization(name: "Ours", actor: insider))

    stranger = generate(AccountsGenerator.user())
    theirs = generate(OrgsGenerator.organization(name: "Theirs", actor: stranger))
    their_project = generate(FlagsGenerator.project(tenant: theirs.id))

    their_environment =
      generate(FlagsGenerator.environment(tenant: theirs.id, project_id: their_project.id))

    %{
      insider: insider,
      ours: ours,
      theirs: theirs,
      their_project: their_project,
      their_environment: their_environment
    }
  end

  describe "an api key cannot be minted into another organization" do
    # A key resolves its organization from its environment, not from the
    # organization it was created under, so one minted across the boundary
    # would stream another organization's flag state to any SDK client.
    test "createEnvironmentApiKey naming a foreign environment is refused", ctx do
      conn =
        gql(scoped_to(ctx.insider, ctx.ours), @create_environment_api_key, %{
          "name" => "leak",
          "environmentId" => ctx.their_environment.id
        })

      assert %{"data" => %{"createEnvironmentApiKey" => payload}} = json(conn)
      assert payload["result"] == nil

      assert [%{"code" => "invalid_attribute", "fields" => ["environment_id"]}] =
               payload["errors"]

      assert payload["metadata"] == nil

      assert EnvironmentApiKey
             |> Ash.Query.filter(environment_id == ^ctx.their_environment.id)
             |> Ash.read!(authorize?: false) == []
    end

    test "a key created within its own organization still works", ctx do
      our_project = generate(FlagsGenerator.project(tenant: ctx.ours.id))

      our_environment =
        generate(FlagsGenerator.environment(tenant: ctx.ours.id, project_id: our_project.id))

      conn =
        gql(scoped_to(ctx.insider, ctx.ours), @create_environment_api_key, %{
          "name" => "ours",
          "environmentId" => our_environment.id
        })

      assert %{"data" => %{"createEnvironmentApiKey" => payload}} = json(conn)
      assert payload["errors"] == []

      plaintext = payload["metadata"]["plaintextApiKey"]

      assert {:ok, socket} =
               Phoenix.ChannelTest.__connect__(
                 @endpoint,
                 SdkSocket,
                 %{"api_key" => plaintext},
                 []
               )

      assert socket.assigns.environment_id == our_environment.id
      assert socket.assigns.organization_id == ctx.ours.id
    end
  end

  describe "creates naming a foreign parent are refused" do
    # The refusal is a field error: this used to fail only because locking the
    # parent project raised an unhandled NotFound, surfacing as "something went
    # wrong".
    test "createFlag with a project in another organization", ctx do
      conn =
        gql(scoped_to(ctx.insider, ctx.ours), @create_flag, %{
          "name" => "leaked_flag",
          "projectId" => ctx.their_project.id
        })

      body = json(conn)
      refute Map.has_key?(body, "errors")

      assert %{"data" => %{"createFlag" => payload}} = body
      assert payload["result"] == nil
      assert [%{"code" => "invalid_attribute", "fields" => ["project_id"]}] = payload["errors"]
    end

    test "createEnvironment with a project in another organization", ctx do
      conn =
        gql(scoped_to(ctx.insider, ctx.ours), @create_environment, %{
          "name" => "leaked_env",
          "projectId" => ctx.their_project.id
        })

      assert %{"data" => %{"createEnvironment" => payload}} = json(conn)
      assert payload["result"] == nil
      assert [%{"code" => "invalid_attribute", "fields" => ["project_id"]}] = payload["errors"]
    end

    test "a project in the scoped organization is accepted", ctx do
      our_project = generate(FlagsGenerator.project(tenant: ctx.ours.id))

      conn =
        gql(scoped_to(ctx.insider, ctx.ours), @create_flag, %{
          "name" => "our_flag",
          "projectId" => our_project.id
        })

      assert %{"data" => %{"createFlag" => %{"errors" => [], "result" => result}}} = json(conn)
      assert result["id"]
    end
  end

  describe "an argument naming an organization must match the scope" do
    test "addMember cannot write into an organization other than the scoped one", ctx do
      newcomer = generate(AccountsGenerator.user())

      conn =
        gql(scoped_to(ctx.insider, ctx.ours), @add_member, %{
          "userId" => newcomer.id,
          "organizationId" => ctx.theirs.id
        })

      assert %{"data" => %{"addMember" => payload}} = json(conn)
      assert payload["result"] == nil

      assert [%{"code" => "invalid_attribute", "fields" => ["organization_id"]}] =
               payload["errors"]

      assert Membership
             |> Ash.Query.filter(organization_id == ^ctx.theirs.id and user_id == ^newcomer.id)
             |> Ash.read!(authorize?: false) == []
    end

    test "addMember into the scoped organization still works", ctx do
      newcomer = generate(AccountsGenerator.user())

      conn =
        gql(scoped_to(ctx.insider, ctx.ours), @add_member, %{
          "userId" => newcomer.id,
          "organizationId" => ctx.ours.id
        })

      assert %{"data" => %{"addMember" => %{"errors" => []}}} = json(conn)
    end
  end

  describe "a refusal never reveals whether the row exists" do
    test "a foreign environment looks the same as a missing one", ctx do
      foreign = create_api_key_response(ctx, ctx.their_environment.id)
      absent = create_api_key_response(ctx, Ash.UUID.generate())

      assert foreign == absent
    end

    test "a foreign project looks the same as a missing one", ctx do
      foreign = create_flag_response(ctx, ctx.their_project.id)
      absent = create_flag_response(ctx, Ash.UUID.generate())

      assert foreign == absent
    end

    test "a foreign organization looks the same as a missing one", ctx do
      outsider = generate(AccountsGenerator.user())

      foreign = gql(scoped_to(outsider, ctx.theirs), @list_projects, %{}).resp_body
      absent = gql(scoped_to(outsider, %{id: Ash.UUID.generate()}), @list_projects, %{}).resp_body

      assert foreign == absent
    end
  end

  describe "membership is answered before the input" do
    test "a non-member of the scoped organization gets not_organization_member", ctx do
      outsider = generate(AccountsGenerator.user())

      conn =
        gql(scoped_to(outsider, ctx.ours), @create_flag, %{
          "name" => "leaked_flag",
          "projectId" => ctx.their_project.id
        })

      assert %{"data" => %{"createFlag" => payload}} = json(conn)
      assert [%{"code" => "not_organization_member"}] = payload["errors"]
    end
  end

  describe "a malformed organization id is refusable, not a crash" do
    # `SetTenant` cannot turn a malformed value into a tenant, so the request
    # arrives without one and has to be refused with a code, not a 400.
    test "a tenant-requiring query with a malformed header returns tenant_not_provided", ctx do
      conn =
        build_conn()
        |> put_req_header("cookie", "railswitch_token=#{ctx.insider.__metadata__.token}")
        |> put_req_header("x-organization-id", "not-a-uuid")
        |> gql(@list_projects, %{})

      assert %{"errors" => [error]} = json(conn)
      assert error["extensions"]["code"] == "tenant_not_provided"
    end
  end

  describe "error codes reach the client" do
    test "a top-level error carries its code under extensions", ctx do
      outsider = generate(AccountsGenerator.user())

      conn = gql(scoped_to(outsider, ctx.ours), @list_projects, %{})

      assert %{"errors" => [error]} = json(conn)
      assert error["extensions"]["code"] == "not_organization_member"
      assert error["message"] == "You are not a member of this organization"
      refute Map.has_key?(error, "code")
    end
  end

  describe "every tenant-scoped resource enforces the scope" do
    # Enforcement is one line per resource, so nothing else stops the next one
    # from silently omitting it.
    test "all attribute-multitenant resources carry ActorInTenant" do
      resources =
        Info.resources(RailswitchBackend.Flags) ++
          Info.resources(RailswitchBackend.Orgs)

      tenant_scoped =
        Enum.filter(resources, &(Ash.Resource.Info.multitenancy_strategy(&1) == :attribute))

      assert tenant_scoped != []

      for resource <- tenant_scoped do
        assert RailswitchBackend.Orgs.Checks.ActorInTenant in policy_checks(resource),
               "#{inspect(resource)} is scoped by organization but does not enforce ActorInTenant"
      end
    end
  end

  describe "every exposed mutation checks the ids it accepts" do
    # Vacuous for updates today — none of them accept a foreign key. It stops
    # being vacuous the moment one does, which is the point: repointing a row
    # at a parent in another organization is the same hole as creating it there.
    #
    # `FlagEnvironment.create` is absent from this list only because it is not
    # exposed. Exposing it would put it here and fail until it is validated.
    test "mutations validate every organization-scoped id they can set" do
      assert unguarded_mutations() == [],
             "unvalidated organization-scoped ids:\n" <>
               Enum.map_join(unguarded_mutations(), "\n", fn {resource, action, field, validation} ->
                 "  #{inspect(resource)}.#{action} can set #{field} but has no #{inspect(validation)}"
               end)
    end
  end

  defp unguarded_mutations do
    for domain <- [RailswitchBackend.Flags, RailswitchBackend.Orgs],
        mutation <- AshGraphql.Domain.Info.mutations(domain),
        mutation.type in [:create, :update],
        action = Ash.Resource.Info.action(mutation.resource, mutation.action),
        violation <- violations(mutation.resource, action) do
      violation
    end
  end

  # An id pointing into an organization-scoped resource has to be checked
  # against the scope; an id that *is* the organization has to equal it.
  defp violations(resource, action) do
    settable = action.accept ++ Enum.map(action.arguments, & &1.name)
    tenant_attribute = Ash.Resource.Info.multitenancy_attribute(resource)

    relationship_violations =
      for %{type: :belongs_to} = relationship <- Ash.Resource.Info.relationships(resource),
          relationship.source_attribute in settable,
          Ash.Resource.Info.multitenancy_strategy(relationship.destination) == :attribute,
          relationship.name not in covered(
            action,
            RelationshipInTenant,
            :relationships
          ) do
        {resource, action.name, relationship.source_attribute, RelationshipInTenant}
      end

    tenant_violations =
      if tenant_attribute in settable and
           tenant_attribute not in covered(action, ArgumentIsTenant, :arguments) do
        [{resource, action.name, tenant_attribute, ArgumentIsTenant}]
      else
        []
      end

    relationship_violations ++ tenant_violations
  end

  defp covered(action, validation, key) do
    for %Ash.Resource.Validation{validation: {^validation, opts}} <- action.changes,
        name <- opts[key] do
      name
    end
  end

  defp policy_checks(resource) do
    resource
    |> Ash.Policy.Info.policies()
    |> Enum.flat_map(fn policy ->
      Enum.map(policy.policies || [], fn %{check_module: check_module} -> check_module end)
    end)
  end

  defp create_api_key_response(ctx, environment_id) do
    gql(scoped_to(ctx.insider, ctx.ours), @create_environment_api_key, %{
      "name" => "probe",
      "environmentId" => environment_id
    }).resp_body
  end

  defp create_flag_response(ctx, project_id) do
    gql(scoped_to(ctx.insider, ctx.ours), @create_flag, %{
      "name" => "probe_flag",
      "projectId" => project_id
    }).resp_body
  end

  defp scoped_to(user, organization) do
    build_conn()
    |> put_req_header("cookie", "railswitch_token=#{user.__metadata__.token}")
    |> put_req_header("x-organization-id", organization.id)
  end

  defp gql(conn, query, variables) do
    conn
    |> put_req_header("content-type", "application/json")
    |> post("/gql", Jason.encode!(%{"query" => query, "variables" => variables}))
  end

  defp json(conn) do
    assert conn.status == 200
    Jason.decode!(conn.resp_body)
  end
end
