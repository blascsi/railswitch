defmodule RailswitchBackendWeb.OrganizationFlowTest do
  @moduledoc """
  End-to-end organization & membership tests through the GraphQL API,
  including multitenancy via the `x-organization-id` header.
  """
  use RailswitchBackendWeb.ConnCase, async: true
  use Ash.Generator

  alias RailswitchBackend.AccountsGenerator
  alias RailswitchBackend.Orgs.Membership
  alias RailswitchBackend.OrgsGenerator

  require Ash.Query

  @create_organization """
  mutation CreateOrganization($name: String!) {
    createOrganization(input: {name: $name}) {
      result { id name }
      errors { code message }
    }
  }
  """

  @list_organizations """
  query {
    listOrganizations { results { id name } }
  }
  """

  @get_organization """
  query GetOrganization($id: ID!) {
    getOrganization(id: $id) { id name }
  }
  """

  @update_organization """
  mutation UpdateOrganization($id: ID!, $name: String!) {
    updateOrganization(id: $id, input: {name: $name}) {
      result { id name }
      errors { code message }
    }
  }
  """

  @delete_organization """
  mutation DeleteOrganization($id: ID!) {
    deleteOrganization(id: $id) {
      result { id }
      errors { code message }
    }
  }
  """

  @current_user_organizations """
  query {
    currentUser { organizations { id } }
  }
  """

  @list_memberships """
  query {
    listMemberships {
      results {
        id
        role
        user { id email }
      }
    }
  }
  """

  @list_environments """
  query {
    listEnvironments { results { id name } }
  }
  """

  @change_member_role """
  mutation ChangeMemberRole($id: ID!) {
    changeMemberRole(id: $id, input: {role: OWNER}) {
      result { id role }
      errors { code message }
    }
  }
  """

  @remove_member """
  mutation RemoveMember($id: ID!) {
    removeMember(id: $id) {
      result { id }
      errors { code message }
    }
  }
  """

  @invite_member """
  mutation InviteMember($email: String!, $role: MembershipRole) {
    inviteMember(input: {email: $email, role: $role})
  }
  """

  describe "inviteMember mutation" do
    test "an owner invites a user by email", %{conn: conn} do
      owner = generate(AccountsGenerator.user())
      org = generate(OrgsGenerator.organization(actor: owner))
      invitee = generate(AccountsGenerator.user())

      conn =
        conn
        |> authed(owner)
        |> put_req_header("x-organization-id", org.id)
        |> gql(@invite_member, %{"email" => to_string(invitee.email), "role" => "OWNER"})

      assert json(conn) == %{"data" => %{"inviteMember" => true}}

      membership =
        Membership
        |> Ash.Query.filter(organization_id == ^org.id and user_id == ^invitee.id)
        |> Ash.read_one!(authorize?: false)

      assert membership.status == :pending
      assert membership.role == :owner
    end

    test "inviting an unknown email looks the same as inviting a real user", %{conn: conn} do
      owner = generate(AccountsGenerator.user())
      org = generate(OrgsGenerator.organization(actor: owner))
      invitee = generate(AccountsGenerator.user())

      invite = fn email ->
        conn
        |> authed(owner)
        |> put_req_header("x-organization-id", org.id)
        |> gql(@invite_member, %{"email" => email})
        |> Map.fetch!(:resp_body)
      end

      assert invite.(to_string(invitee.email)) == invite.("nobody@example.com")
    end
  end

  describe "createOrganization mutation" do
    test "an authenticated user creates an organization and becomes its owner", %{conn: conn} do
      user = generate(AccountsGenerator.user())

      conn = gql(authed(conn, user), @create_organization, %{"name" => "Acme"})

      assert %{"data" => %{"createOrganization" => %{"result" => result, "errors" => []}}} =
               json(conn)

      assert result["name"] == "Acme"
    end

    test "an unauthenticated request cannot create an organization", %{conn: conn} do
      conn = gql(conn, @create_organization, %{"name" => "Nope"})

      assert %{"data" => %{"createOrganization" => %{"result" => nil, "errors" => errors}}} =
               json(conn)

      assert Enum.any?(errors, &(&1["code"] == "forbidden"))
    end
  end

  describe "organization queries" do
    test "lists only organizations the actor belongs to", %{conn: conn} do
      user = generate(AccountsGenerator.user())
      mine = generate(OrgsGenerator.organization(name: "Mine", actor: user))

      other = generate(AccountsGenerator.user())
      _theirs = generate(OrgsGenerator.organization(name: "Theirs", actor: other))

      conn = gql(authed(conn, user), @list_organizations)

      assert %{"data" => %{"listOrganizations" => %{"results" => results}}} = json(conn)
      assert mine.id in Enum.map(results, & &1["id"])
      refute Enum.any?(results, &(&1["name"] == "Theirs"))
    end

    test "a member can fetch an organization by id", %{conn: conn} do
      user = generate(AccountsGenerator.user())
      org = generate(OrgsGenerator.organization(name: "Readable", actor: user))

      conn = gql(authed(conn, user), @get_organization, %{"id" => org.id})

      assert %{"data" => %{"getOrganization" => %{"name" => "Readable"}}} = json(conn)
    end

    test "a non-member cannot fetch an organization by id", %{conn: conn} do
      owner = generate(AccountsGenerator.user())
      org = generate(OrgsGenerator.organization(actor: owner))
      outsider = generate(AccountsGenerator.user())

      conn = gql(authed(conn, outsider), @get_organization, %{"id" => org.id})

      assert %{"data" => %{"getOrganization" => nil}} = json(conn)
    end
  end

  describe "owners without an accepted membership" do
    setup ctx do
      owner = generate(AccountsGenerator.user())
      org = generate(OrgsGenerator.organization(actor: owner))
      invitee = generate(AccountsGenerator.user())

      generate(
        OrgsGenerator.membership(
          organization_id: org.id,
          user_id: invitee.id,
          role: :owner,
          status: ctx.status
        )
      )

      %{org: org, invitee: invitee}
    end

    for status <- [:pending, :declined] do
      @tag status: status
      test "an owner with a #{status} membership does not see the organization in listOrganizations",
           %{conn: conn} = ctx do
        conn = gql(authed(conn, ctx.invitee), @list_organizations)

        assert %{"data" => %{"listOrganizations" => %{"results" => []}}} = json(conn)
      end

      @tag status: status
      test "an owner with a #{status} membership cannot fetch the organization by id",
           %{conn: conn} = ctx do
        conn = gql(authed(conn, ctx.invitee), @get_organization, %{"id" => ctx.org.id})

        assert %{"data" => %{"getOrganization" => nil}} = json(conn)
      end

      @tag status: status
      test "an owner with a #{status} membership does not see the organization among their own organizations",
           %{conn: conn} = ctx do
        conn = gql(authed(conn, ctx.invitee), @current_user_organizations)

        assert %{"data" => %{"currentUser" => %{"organizations" => []}}} = json(conn)
      end

      @tag status: status
      test "an owner with a #{status} membership cannot rename the organization",
           %{conn: conn} = ctx do
        conn =
          gql(authed(conn, ctx.invitee), @update_organization, %{
            "id" => ctx.org.id,
            "name" => "Taken"
          })

        assert %{"data" => %{"updateOrganization" => %{"result" => nil}}} = json(conn)
      end

      @tag status: status
      test "an owner with a #{status} membership cannot delete the organization",
           %{conn: conn} = ctx do
        conn = gql(authed(conn, ctx.invitee), @delete_organization, %{"id" => ctx.org.id})

        assert %{"data" => %{"deleteOrganization" => %{"result" => nil}}} = json(conn)
      end
    end
  end

  describe "updateOrganization mutation" do
    test "an owner can rename the organization", %{conn: conn} do
      user = generate(AccountsGenerator.user())
      org = generate(OrgsGenerator.organization(name: "Before", actor: user))

      conn =
        gql(authed(conn, user), @update_organization, %{"id" => org.id, "name" => "After"})

      assert %{"data" => %{"updateOrganization" => %{"result" => result, "errors" => []}}} =
               json(conn)

      assert result["name"] == "After"
    end
  end

  describe "deleteOrganization mutation" do
    test "an owner can delete the organization", %{conn: conn} do
      user = generate(AccountsGenerator.user())
      org = generate(OrgsGenerator.organization(actor: user))

      conn = gql(authed(conn, user), @delete_organization, %{"id" => org.id})

      assert %{"data" => %{"deleteOrganization" => %{"errors" => []}}} = json(conn)
    end
  end

  describe "x-organization-id tenancy" do
    test "scopes membership listing to the given organization", %{conn: conn} do
      user = generate(AccountsGenerator.user())
      org_a = generate(OrgsGenerator.organization(name: "A", actor: user))
      org_b = generate(OrgsGenerator.organization(name: "B", actor: user))

      membership_a = owner_membership_id(org_a)
      membership_b = owner_membership_id(org_b)

      conn =
        conn
        |> authed(user)
        |> put_req_header("x-organization-id", org_a.id)
        |> gql(@list_memberships)

      assert %{"data" => %{"listMemberships" => %{"results" => results}}} = json(conn)
      ids = Enum.map(results, & &1["id"])

      # The user owns both orgs, but the tenant header scopes the read to org A.
      assert membership_a in ids
      refute membership_b in ids
    end

    test "ignores a malformed x-organization-id header", %{conn: conn} do
      user = generate(AccountsGenerator.user())
      org_a = generate(OrgsGenerator.organization(name: "A", actor: user))
      org_b = generate(OrgsGenerator.organization(name: "B", actor: user))

      conn =
        conn
        |> authed(user)
        |> put_req_header("x-organization-id", "not-a-uuid")
        |> gql(@list_memberships)

      # A malformed id cannot identify any organization, so it is treated the
      # same as omitting the header: the (global) membership read is unscoped.
      assert %{"data" => %{"listMemberships" => %{"results" => results}}} = json(conn)
      ids = Enum.map(results, & &1["id"])
      assert owner_membership_id(org_a) in ids
      assert owner_membership_id(org_b) in ids
    end

    test "a tenant-requiring query without the header returns tenant_not_provided", %{conn: conn} do
      user = generate(AccountsGenerator.user())

      conn = gql(authed(conn, user), @list_environments)

      assert %{"errors" => errors} = json(conn)
      assert Enum.any?(errors, &(&1["extensions"]["code"] == "tenant_not_provided"))
    end
  end

  describe "membership management via the API" do
    test "listing memberships can include each member's email and id", %{conn: conn} do
      member_email = "member@example.com"
      owner = generate(AccountsGenerator.user(email: "owner@example.com"))
      org = generate(OrgsGenerator.organization(actor: owner))
      member = generate(AccountsGenerator.user(email: member_email))

      generate(OrgsGenerator.membership(organization_id: org.id, user_id: member.id, actor: owner))

      conn = gql(authed(conn, owner), @list_memberships)

      assert %{"data" => %{"listMemberships" => %{"results" => results}}} = json(conn)

      emails = Enum.map(results, &get_in(&1, ["user", "email"]))
      assert member_email in emails

      user_ids = Enum.map(results, &get_in(&1, ["user", "id"]))
      assert member.id in user_ids

      refute conn.resp_body =~ "hashed_password"
    end

    test "an owner can change a member's role", %{conn: conn} do
      owner = generate(AccountsGenerator.user())
      org = generate(OrgsGenerator.organization(actor: owner))
      member = generate(AccountsGenerator.user())

      membership =
        generate(OrgsGenerator.membership(organization_id: org.id, user_id: member.id, actor: owner))

      conn = gql(authed(conn, owner), @change_member_role, %{"id" => membership.id})

      assert %{"data" => %{"changeMemberRole" => %{"result" => result, "errors" => []}}} =
               json(conn)

      assert result["role"] == "OWNER"
    end

    test "a member can remove themselves", %{conn: conn} do
      owner = generate(AccountsGenerator.user())
      org = generate(OrgsGenerator.organization(actor: owner))
      member = generate(AccountsGenerator.user())

      membership =
        generate(OrgsGenerator.membership(organization_id: org.id, user_id: member.id, actor: owner))

      conn = gql(authed(conn, member), @remove_member, %{"id" => membership.id})

      assert %{"data" => %{"removeMember" => %{"errors" => []}}} = json(conn)
    end
  end

  defp authed(conn, user) do
    put_req_header(conn, "cookie", "railswitch_token=#{user.__metadata__.token}")
  end

  defp gql(conn, query, variables \\ %{}) do
    conn
    |> put_req_header("content-type", "application/json")
    |> post("/gql", Jason.encode!(%{"query" => query, "variables" => variables}))
  end

  defp json(conn) do
    assert conn.status == 200
    Jason.decode!(conn.resp_body)
  end

  defp owner_membership_id(org) do
    Membership
    |> Ash.Query.filter(organization_id == ^org.id and role == :owner)
    |> Ash.read_one!(authorize?: false)
    |> Map.fetch!(:id)
  end
end
