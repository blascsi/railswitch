defmodule RailswitchBackendWeb.OrganizationFlowTest do
  @moduledoc """
  End-to-end organization & membership tests through the JSON:API, including
  multitenancy via the `x-organization-id` header.
  """
  use RailswitchBackendWeb.ConnCase, async: true
  use Ash.Generator

  alias RailswitchBackend.AccountsGenerator
  alias RailswitchBackend.Orgs.Membership
  alias RailswitchBackend.OrgsGenerator

  require Ash.Query

  describe "POST /organizations" do
    test "an authenticated user creates an organization and becomes its owner", %{conn: conn} do
      user = generate(AccountsGenerator.user())

      body =
        Jason.encode!(%{
          "data" => %{"type" => "organization", "attributes" => %{"name" => "Acme"}}
        })

      conn = post(authed(conn, user), "/api/json/organizations", body)

      assert conn.status == 201
      assert data(conn)["attributes"]["name"] == "Acme"
    end

    test "an unauthenticated request cannot create an organization", %{conn: conn} do
      body =
        Jason.encode!(%{
          "data" => %{"type" => "organization", "attributes" => %{"name" => "Nope"}}
        })

      conn =
        conn
        |> put_req_header("content-type", "application/vnd.api+json")
        |> put_req_header("accept", "application/vnd.api+json")
        |> post("/api/json/organizations", body)

      assert conn.status == 403
    end
  end

  describe "GET /organizations" do
    test "lists only organizations the actor belongs to", %{conn: conn} do
      user = generate(AccountsGenerator.user())
      mine = generate(OrgsGenerator.organization(name: "Mine", actor: user))

      other = generate(AccountsGenerator.user())
      _theirs = generate(OrgsGenerator.organization(name: "Theirs", actor: other))

      conn = get(authed(conn, user), "/api/json/organizations")

      assert conn.status == 200
      ids = Enum.map(data(conn), & &1["id"])
      assert mine.id in ids
      refute Enum.any?(data(conn), &(&1["attributes"]["name"] == "Theirs"))
    end

    test "a member can fetch an organization by id", %{conn: conn} do
      user = generate(AccountsGenerator.user())
      org = generate(OrgsGenerator.organization(name: "Readable", actor: user))

      conn = get(authed(conn, user), "/api/json/organizations/#{org.id}")

      assert conn.status == 200
      assert data(conn)["attributes"]["name"] == "Readable"
    end

    test "a non-member cannot fetch an organization by id", %{conn: conn} do
      owner = generate(AccountsGenerator.user())
      org = generate(OrgsGenerator.organization(actor: owner))
      outsider = generate(AccountsGenerator.user())

      conn = get(authed(conn, outsider), "/api/json/organizations/#{org.id}")

      assert conn.status == 404
    end
  end

  describe "PATCH /organizations/:id" do
    test "an owner can rename the organization", %{conn: conn} do
      user = generate(AccountsGenerator.user())
      org = generate(OrgsGenerator.organization(name: "Before", actor: user))

      body =
        Jason.encode!(%{
          "data" => %{
            "type" => "organization",
            "id" => org.id,
            "attributes" => %{"name" => "After"}
          }
        })

      conn = patch(authed(conn, user), "/api/json/organizations/#{org.id}", body)

      assert conn.status == 200
      assert data(conn)["attributes"]["name"] == "After"
    end
  end

  describe "DELETE /organizations/:id" do
    test "an owner can delete the organization", %{conn: conn} do
      user = generate(AccountsGenerator.user())
      org = generate(OrgsGenerator.organization(actor: user))

      conn = delete(authed(conn, user), "/api/json/organizations/#{org.id}")

      assert conn.status in [200, 204]
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
        |> get("/api/json/memberships")

      assert conn.status == 200
      ids = Enum.map(data(conn), & &1["id"])

      # The user owns both orgs, but the tenant header scopes the read to org A.
      assert membership_a in ids
      refute membership_b in ids
    end

    test "rejects an invalid x-organization-id header", %{conn: conn} do
      user = generate(AccountsGenerator.user())

      conn =
        conn
        |> authed(user)
        |> put_req_header("x-organization-id", "not-a-uuid")
        |> get("/api/json/memberships")

      assert conn.status == 400
      assert %{"errors" => [%{"code" => "invalid_header"}]} = Jason.decode!(conn.resp_body)
    end
  end

  describe "membership management via the API" do
    test "an owner can add a member", %{conn: conn} do
      owner = generate(AccountsGenerator.user())
      org = generate(OrgsGenerator.organization(actor: owner))
      member = generate(AccountsGenerator.user())

      conn =
        post(authed(conn, owner), "/api/json/memberships", membership_body(org, member, :member))

      assert conn.status == 201

      assert Membership
             |> Ash.Query.filter(organization_id == ^org.id and user_id == ^member.id)
             |> Ash.read_one!(authorize?: false)
    end

    test "listing memberships can include each member's email and id", %{conn: conn} do
      member_email = "member@example.com"
      owner = generate(AccountsGenerator.user(email: "owner@example.com"))
      org = generate(OrgsGenerator.organization(actor: owner))
      member = generate(AccountsGenerator.user(email: member_email))

      generate(OrgsGenerator.membership(organization_id: org.id, user_id: member.id, actor: owner))

      conn = get(authed(conn, owner), "/api/json/memberships?include=user")

      assert conn.status == 200
      body = Jason.decode!(conn.resp_body)

      emails = Enum.map(body["included"], & &1["attributes"]["email"])
      assert member_email in emails

      user_ids = Enum.map(body["data"], &get_in(&1, ["relationships", "user", "data", "id"]))
      assert member.id in user_ids

      refute conn.resp_body =~ "hashed_password"
    end

    test "a non-owner cannot add a member", %{conn: conn} do
      owner = generate(AccountsGenerator.user())
      org = generate(OrgsGenerator.organization(actor: owner))
      member = generate(AccountsGenerator.user())

      generate(OrgsGenerator.membership(organization_id: org.id, user_id: member.id, actor: owner))

      outsider = generate(AccountsGenerator.user())

      conn =
        post(
          authed(conn, member),
          "/api/json/memberships",
          membership_body(org, outsider, :member)
        )

      assert conn.status == 403
    end

    test "an owner can change a member's role", %{conn: conn} do
      owner = generate(AccountsGenerator.user())
      org = generate(OrgsGenerator.organization(actor: owner))
      member = generate(AccountsGenerator.user())

      membership =
        generate(OrgsGenerator.membership(organization_id: org.id, user_id: member.id, actor: owner))

      body =
        Jason.encode!(%{
          "data" => %{
            "type" => "membership",
            "id" => membership.id,
            "attributes" => %{"role" => "owner"}
          }
        })

      conn = patch(authed(conn, owner), "/api/json/memberships/#{membership.id}", body)

      assert conn.status == 200
      assert data(conn)["attributes"]["role"] == "owner"
    end

    test "a member can remove themselves", %{conn: conn} do
      owner = generate(AccountsGenerator.user())
      org = generate(OrgsGenerator.organization(actor: owner))
      member = generate(AccountsGenerator.user())

      membership =
        generate(OrgsGenerator.membership(organization_id: org.id, user_id: member.id, actor: owner))

      conn = delete(authed(conn, member), "/api/json/memberships/#{membership.id}")

      assert conn.status in [200, 204]
    end
  end

  defp authed(conn, user) do
    conn
    |> put_req_header("content-type", "application/vnd.api+json")
    |> put_req_header("accept", "application/vnd.api+json")
    |> put_req_header("cookie", "railswitch_token=#{user.__metadata__.token}")
  end

  defp data(conn), do: Jason.decode!(conn.resp_body)["data"]

  defp owner_membership_id(org) do
    Membership
    |> Ash.Query.filter(organization_id == ^org.id and role == :owner)
    |> Ash.read_one!(authorize?: false)
    |> Map.fetch!(:id)
  end

  defp membership_body(org, user, role) do
    Jason.encode!(%{
      "data" => %{
        "type" => "membership",
        "attributes" => %{
          "role" => to_string(role),
          "user_id" => user.id,
          "organization_id" => org.id
        }
      }
    })
  end
end
