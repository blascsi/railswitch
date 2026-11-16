defmodule RailswitchBackend.Orgs.OrganizationTest do
  @moduledoc """
  Action and policy tests for `RailswitchBackend.Orgs.Organization`.
  """
  use RailswitchBackend.DataCase, async: true

  import Ash.Generator

  alias Ash.Error.Forbidden
  alias Ash.Error.Invalid
  alias Ash.Error.Query.NotFound
  alias RailswitchBackend.AccountsGenerator
  alias RailswitchBackend.Orgs
  alias RailswitchBackend.Orgs.Membership
  alias RailswitchBackend.OrgsGenerator

  require Ash.Query

  setup do
    owner = generate(AccountsGenerator.user())
    org = generate(OrgsGenerator.organization(actor: owner))
    outsider = generate(AccountsGenerator.user())

    %{
      owner: owner,
      org: org,
      outsider: outsider
    }
  end

  describe "create_organization" do
    test "creates the organization with the given name", ctx do
      org = Orgs.create_organization!("Acme", actor: ctx.owner)

      assert org.name == "Acme"
    end

    test "adds the creating actor as an owner membership", ctx do
      org = Orgs.create_organization!("Acme", actor: ctx.owner)

      assert [membership] = memberships_of(org)
      assert membership.user_id == ctx.owner.id
      assert membership.role == :owner
      assert membership.status == :accepted
    end

    test "policy - a request without an actor is refused" do
      assert {:error, %Forbidden{}} =
               Orgs.create_organization("Anon", actor: nil)
    end
  end

  describe "get_organization" do
    test "returns the organization to a member", ctx do
      assert {:ok, fetched} = Orgs.get_organization(ctx.org.id, actor: ctx.owner)
      assert fetched.id == ctx.org.id
    end

    test "policy - an outsider does not find the organization", ctx do
      assert {:error, %Invalid{errors: [%NotFound{}]}} =
               Orgs.get_organization(ctx.org.id, actor: ctx.outsider)
    end

    test "policy - a request without an actor does not find the organization", ctx do
      assert {:error, %Invalid{errors: [%NotFound{}]}} =
               Orgs.get_organization(ctx.org.id, actor: nil)
    end

    for status <- [:pending, :declined] do
      @tag status: status
      test "policy - an owner with a #{status} membership does not find the organization", ctx do
        invitee = generate(AccountsGenerator.user())

        generate(
          OrgsGenerator.membership(
            organization_id: ctx.org.id,
            user_id: invitee.id,
            role: :owner,
            status: ctx.status
          )
        )

        assert {:error, %Invalid{errors: [%NotFound{}]}} =
                 Orgs.get_organization(ctx.org.id, actor: invitee)
      end
    end
  end

  describe "list_organizations" do
    test "returns only organizations the actor is a member of", ctx do
      theirs = generate(OrgsGenerator.organization(actor: ctx.outsider))

      assert {:ok, orgs} = Orgs.list_organizations(actor: ctx.owner)
      ids = Enum.map(orgs, & &1.id)

      assert ctx.org.id in ids
      refute theirs.id in ids
    end

    test "policy - an outsider does not see the organization", ctx do
      assert {:ok, []} = Orgs.list_organizations(actor: ctx.outsider)
    end

    test "policy - a request without an actor sees no organizations" do
      assert {:ok, []} = Orgs.list_organizations(actor: nil)
    end

    for status <- [:pending, :declined] do
      @tag status: status
      test "policy - an owner with a #{status} membership does not see the organization", ctx do
        invitee = generate(AccountsGenerator.user())

        generate(
          OrgsGenerator.membership(
            organization_id: ctx.org.id,
            user_id: invitee.id,
            role: :owner,
            status: ctx.status
          )
        )

        assert {:ok, []} = Orgs.list_organizations(actor: invitee)
      end
    end
  end

  describe "update_organization" do
    test "renames the organization for an owner", ctx do
      new_name = "After"

      assert {:ok, updated} =
               Orgs.update_organization(ctx.org, new_name, actor: ctx.owner)

      assert updated.name == new_name
    end

    test "policy - a plain member is refused", ctx do
      member = generate(AccountsGenerator.user())
      generate(OrgsGenerator.membership(organization_id: ctx.org.id, user_id: member.id))

      assert {:error, %Forbidden{}} =
               Orgs.update_organization(ctx.org, "Nope", actor: member)
    end

    test "policy - an outsider is refused", ctx do
      assert {:error, %Forbidden{}} =
               Orgs.update_organization(ctx.org, "Nope", actor: ctx.outsider)
    end

    test "policy - a request without an actor is refused", ctx do
      assert {:error, %Forbidden{}} =
               Orgs.update_organization(ctx.org, "Nope", actor: nil)
    end

    for status <- [:pending, :declined] do
      @tag status: status
      test "policy - an owner with a #{status} membership is refused", ctx do
        invitee = generate(AccountsGenerator.user())

        generate(
          OrgsGenerator.membership(
            organization_id: ctx.org.id,
            user_id: invitee.id,
            role: :owner,
            status: ctx.status
          )
        )

        assert {:error, %Forbidden{}} =
                 Orgs.update_organization(ctx.org, "Taken", actor: invitee)
      end
    end
  end

  describe "delete_organization" do
    test "deletes the organization and its memberships for an owner", ctx do
      assert :ok = Orgs.delete_organization(ctx.org, actor: ctx.owner)
      assert memberships_of(ctx.org) == []
    end

    test "policy - a plain member is refused", ctx do
      member = generate(AccountsGenerator.user())
      generate(OrgsGenerator.membership(organization_id: ctx.org.id, user_id: member.id))

      assert {:error, %Forbidden{}} = Orgs.delete_organization(ctx.org, actor: member)
    end

    test "policy - an outsider is refused", ctx do
      assert {:error, %Forbidden{}} = Orgs.delete_organization(ctx.org, actor: ctx.outsider)
    end

    test "policy - a request without an actor is refused", ctx do
      assert {:error, %Forbidden{}} = Orgs.delete_organization(ctx.org, actor: nil)
    end

    for status <- [:pending, :declined] do
      @tag status: status
      test "policy - an owner with a #{status} membership is refused", ctx do
        invitee = generate(AccountsGenerator.user())

        generate(
          OrgsGenerator.membership(
            organization_id: ctx.org.id,
            user_id: invitee.id,
            role: :owner,
            status: ctx.status
          )
        )

        assert {:error, %Forbidden{}} = Orgs.delete_organization(ctx.org, actor: invitee)
      end
    end
  end

  describe "relationships" do
    test "users - only lists users with an accepted membership", ctx do
      member = generate(AccountsGenerator.user())
      pending_user = generate(AccountsGenerator.user())
      declined_user = generate(AccountsGenerator.user())

      generate(OrgsGenerator.membership(organization_id: ctx.org.id, user_id: member.id))

      generate(
        OrgsGenerator.membership(
          organization_id: ctx.org.id,
          user_id: pending_user.id,
          status: :pending
        )
      )

      generate(
        OrgsGenerator.membership(
          organization_id: ctx.org.id,
          user_id: declined_user.id,
          status: :declined
        )
      )

      org = Ash.load!(ctx.org, :users, authorize?: false)

      assert org.users |> Enum.map(& &1.id) |> Enum.sort() ==
               Enum.sort([ctx.owner.id, member.id])
    end
  end

  defp memberships_of(org) do
    Membership
    |> Ash.Query.filter(organization_id == ^org.id)
    |> Ash.read!(authorize?: false)
  end
end
