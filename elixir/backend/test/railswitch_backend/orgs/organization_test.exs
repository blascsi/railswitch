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

  describe "create" do
    test "creates the organization with the given name" do
      owner = generate(AccountsGenerator.user())
      org = Orgs.create_organization!("Acme", actor: owner)

      assert org.name == "Acme"
    end

    test "adds the creating actor as an owner membership" do
      owner = generate(AccountsGenerator.user())
      org = Orgs.create_organization!("Acme", actor: owner)

      assert [membership] = memberships_of(org)
      assert membership.user_id == owner.id
      assert membership.role == :owner
      assert membership.status == :accepted
    end
  end

  describe "update" do
    test "an owner can rename the organization" do
      new_name = "After"
      owner = generate(AccountsGenerator.user())
      org = Orgs.create_organization!("Before", actor: owner)

      assert {:ok, updated} =
               Orgs.update_organization(org, new_name, actor: owner)

      assert updated.name == new_name
    end
  end

  describe "read" do
    test "listing returns only organizations the actor is a member of" do
      user = generate(AccountsGenerator.user())
      mine = Orgs.create_organization!("Mine", actor: user)

      other = generate(AccountsGenerator.user())
      theirs = Orgs.create_organization!("Theirs", actor: other)

      assert {:ok, orgs} = Orgs.list_organizations(actor: user)
      ids = Enum.map(orgs, & &1.id)

      assert mine.id in ids
      refute theirs.id in ids
    end
  end

  describe "destroy" do
    test "an owner can delete the organization" do
      owner = generate(AccountsGenerator.user())
      org = Orgs.create_organization!("Deletable", actor: owner)

      assert :ok = Ash.destroy!(org, actor: owner, return_destroyed?: false)
      assert memberships_of(org) == []
    end
  end

  describe "policies" do
    test "a member can read an organization they belong to" do
      owner = generate(AccountsGenerator.user())
      org = Orgs.create_organization!("Readable", actor: owner)

      assert {:ok, fetched} = Orgs.get_organization(org.id, actor: owner)
      assert fetched.id == org.id
    end

    test "a non-member cannot read the organization" do
      owner = generate(AccountsGenerator.user())
      outsider = generate(AccountsGenerator.user())
      org = Orgs.create_organization!("Hidden", actor: owner)

      assert {:error, %Invalid{errors: [%NotFound{}]}} =
               Orgs.get_organization(org.id, actor: outsider)
    end

    test "creating an organization requires an actor" do
      assert {:error, %Forbidden{}} =
               Orgs.create_organization("Anon", actor: nil)
    end

    test "a plain member cannot update the organization" do
      owner = generate(AccountsGenerator.user())
      member = generate(AccountsGenerator.user())
      org = Orgs.create_organization!("Org", actor: owner)

      generate(
        OrgsGenerator.membership(
          organization_id: org.id,
          user_id: member.id,
          role: :member,
          actor: owner
        )
      )

      assert {:error, %Forbidden{}} =
               Orgs.update_organization(org, "Nope", actor: member)
    end

    test "a plain member cannot delete the organization" do
      owner = generate(AccountsGenerator.user())
      member = generate(AccountsGenerator.user())
      org = Orgs.create_organization!("Org", actor: owner)

      generate(
        OrgsGenerator.membership(
          organization_id: org.id,
          user_id: member.id,
          role: :member,
          actor: owner
        )
      )

      assert {:error, %Forbidden{}} = Orgs.delete_organization(org, actor: member)
    end
  end

  describe "owners without an accepted membership" do
    setup ctx do
      owner = generate(AccountsGenerator.user())
      invitee = generate(AccountsGenerator.user())
      org = Orgs.create_organization!("Acme", actor: owner)

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
      test "an owner with a #{status} membership does not see the organization in their list",
           ctx do
        assert {:ok, []} = Orgs.list_organizations(actor: ctx.invitee)
      end

      @tag status: status
      test "an owner with a #{status} membership cannot get the organization", ctx do
        assert {:error, %Invalid{errors: [%NotFound{}]}} =
                 Orgs.get_organization(ctx.org.id, actor: ctx.invitee)
      end

      @tag status: status
      test "an owner with a #{status} membership cannot update the organization", ctx do
        assert {:error, %Forbidden{}} =
                 Orgs.update_organization(ctx.org, "Taken", actor: ctx.invitee)
      end

      @tag status: status
      test "an owner with a #{status} membership cannot delete the organization", ctx do
        assert {:error, %Forbidden{}} = Orgs.delete_organization(ctx.org, actor: ctx.invitee)
      end
    end
  end

  describe "user relationships" do
    test "only lists users with an accepted membership" do
      owner = generate(AccountsGenerator.user())
      member = generate(AccountsGenerator.user())
      pending_user = generate(AccountsGenerator.user())
      declined_user = generate(AccountsGenerator.user())
      org = Orgs.create_organization!("Acme", actor: owner)

      generate(OrgsGenerator.membership(organization_id: org.id, user_id: member.id))

      generate(
        OrgsGenerator.membership(
          organization_id: org.id,
          user_id: pending_user.id,
          status: :pending
        )
      )

      generate(
        OrgsGenerator.membership(
          organization_id: org.id,
          user_id: declined_user.id,
          status: :declined
        )
      )

      org = Ash.load!(org, :users, authorize?: false)

      assert org.users |> Enum.map(& &1.id) |> Enum.sort() == Enum.sort([owner.id, member.id])
    end
  end

  defp memberships_of(org) do
    Membership
    |> Ash.Query.filter(organization_id == ^org.id)
    |> Ash.read!(authorize?: false)
  end
end
