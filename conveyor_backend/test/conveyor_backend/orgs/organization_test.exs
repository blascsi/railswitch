defmodule ConveyorBackend.Orgs.OrganizationTest do
  @moduledoc """
  Action and policy tests for `ConveyorBackend.Orgs.Organization`.
  """
  use ConveyorBackend.DataCase, async: true

  import Ash.Generator

  alias Ash.Error.Forbidden
  alias ConveyorBackend.AccountsGenerator
  alias ConveyorBackend.Orgs
  alias ConveyorBackend.Orgs.Membership
  alias ConveyorBackend.OrgsGenerator

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

      assert {:error, %Ash.Error.Invalid{errors: [%Ash.Error.Query.NotFound{}]}} =
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

  defp memberships_of(org) do
    Membership
    |> Ash.Query.filter(organization_id == ^org.id)
    |> Ash.read!(authorize?: false)
  end
end
