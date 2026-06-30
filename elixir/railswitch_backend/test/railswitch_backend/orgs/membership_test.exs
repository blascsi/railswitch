defmodule RailswitchBackend.Orgs.MembershipTest do
  @moduledoc """
  Action and policy tests for `RailswitchBackend.Orgs.Membership`, including the
  `EnsureRemainingOwner` guard that keeps every organization owned.
  """
  use RailswitchBackend.DataCase, async: true

  import Ash.Generator

  alias Ash.Error.Forbidden
  alias RailswitchBackend.AccountsGenerator
  alias RailswitchBackend.Orgs
  alias RailswitchBackend.Orgs.Membership
  alias RailswitchBackend.OrgsGenerator

  require Ash.Query

  describe "create" do
    test "an owner can add a member to the organization" do
      {owner, org, _} = org_with_owner()
      member = generate(AccountsGenerator.user())

      membership = Orgs.add_member!(org.id, member.id, :member, actor: owner)

      assert membership.role == :member
      assert membership.organization_id == org.id
      assert membership.user_id == member.id
    end

    test "an owner can add a second owner" do
      {owner, org, _} = org_with_owner()
      member = generate(AccountsGenerator.user())

      membership = Orgs.add_member!(org.id, member.id, :owner, actor: owner)

      assert membership.role == :owner
    end

    test "adding the same user to an organization twice is rejected" do
      {owner, org, _} = org_with_owner()
      member = generate(AccountsGenerator.user())

      Orgs.add_member!(org.id, member.id, :member, actor: owner)

      assert {:error, error} = Orgs.add_member(org.id, member.id, :member, authorize?: false)
      assert Exception.message(error) =~ "already been taken"
    end
  end

  describe "change_role" do
    test "an owner can promote a member to owner" do
      {owner, org, _} = org_with_owner()
      member = generate(AccountsGenerator.user())
      membership = Orgs.add_member!(org.id, member.id, :member, actor: owner)

      assert {:ok, updated} =
               Orgs.change_member_role(membership, :owner, actor: owner)

      assert updated.role == :owner
    end

    test "an owner can be demoted while another owner remains" do
      {owner, org, owner_membership} = org_with_owner()
      second = generate(AccountsGenerator.user())
      Orgs.add_member!(org.id, second.id, :owner, actor: owner)

      assert {:ok, updated} =
               Orgs.change_member_role(owner_membership, :member, actor: owner)

      assert updated.role == :member
    end

    test "demoting the last owner is blocked" do
      {owner, _org, owner_membership} = org_with_owner()

      assert {:error, error} =
               Orgs.change_member_role(owner_membership, :member, actor: owner)

      assert Exception.message(error) =~ "at least one owner"
    end
  end

  describe "destroy" do
    test "an owner can remove a member" do
      {owner, org, _} = org_with_owner()
      member = generate(AccountsGenerator.user())
      membership = Orgs.add_member!(org.id, member.id, :member, actor: owner)

      assert :ok = Orgs.remove_member(membership, actor: owner)
      assert is_nil(membership_for(org, member))
    end

    test "a member can remove themselves" do
      {owner, org, _} = org_with_owner()
      member = generate(AccountsGenerator.user())
      membership = Orgs.add_member!(org.id, member.id, :member, actor: owner)

      assert :ok = Orgs.remove_member(membership, actor: member)
    end

    test "an owner can leave while another owner remains" do
      {owner, org, owner_membership} = org_with_owner()
      second = generate(AccountsGenerator.user())
      Orgs.add_member!(org.id, second.id, :owner, actor: owner)

      assert :ok = Orgs.remove_member(owner_membership, actor: owner)
    end

    test "removing the last owner is blocked" do
      {owner, _org, owner_membership} = org_with_owner()

      assert {:error, error} = Orgs.remove_member(owner_membership, actor: owner)
      assert Exception.message(error) =~ "at least one owner"
    end
  end

  describe "policies" do
    test "a user can see their own membership" do
      {owner, _org, owner_membership} = org_with_owner()
      {_other_owner, _other_org, other_membership} = org_with_owner()

      assert {:ok, seen} = Orgs.list_memberships(actor: owner)

      seen_ids = Enum.map(seen, & &1.id)
      assert owner_membership.id in seen_ids
      refute other_membership.id in seen_ids
    end

    test "members of an organization can see each other's memberships" do
      {owner, org, owner_membership} = org_with_owner()
      member = generate(AccountsGenerator.user())
      member_membership = Orgs.add_member!(org.id, member.id, :member, actor: owner)

      # The member can see the owner's membership because they share the org.
      assert {:ok, ids} =
               [query: [filter: [organization_id: org.id]], actor: member]
               |> Orgs.list_memberships()
               |> then(fn {:ok, records} -> {:ok, Enum.map(records, & &1.id)} end)

      assert owner_membership.id in ids
      assert member_membership.id in ids
    end

    test "a non-member cannot see an organization's memberships" do
      {_owner, org, _} = org_with_owner()
      outsider = generate(AccountsGenerator.user())

      assert {:ok, []} =
               Orgs.list_memberships(query: [filter: [organization_id: org.id]], actor: outsider)
    end

    test "only owners can add members" do
      {owner, org, _} = org_with_owner()
      member = generate(AccountsGenerator.user())
      Orgs.add_member!(org.id, member.id, :member, actor: owner)

      outsider = generate(AccountsGenerator.user())

      assert {:error, %Forbidden{}} =
               Orgs.add_member(org.id, outsider.id, :member, actor: member)
    end

    test "a member cannot remove another member" do
      {owner, org, _} = org_with_owner()
      member_a = generate(AccountsGenerator.user())
      member_b = generate(AccountsGenerator.user())

      Orgs.add_member!(org.id, member_a.id, :member, actor: owner)
      membership_b = Orgs.add_member!(org.id, member_b.id, :member, actor: owner)

      assert {:error, %Forbidden{}} = Orgs.remove_member(membership_b, actor: member_a)
    end

    test "a non-owner member cannot change a role" do
      {owner, org, _} = org_with_owner()
      member = generate(AccountsGenerator.user())
      target = generate(AccountsGenerator.user())

      Orgs.add_member!(org.id, member.id, :member, actor: owner)
      target_membership = Orgs.add_member!(org.id, target.id, :member, actor: owner)

      assert {:error, %Forbidden{}} =
               Orgs.change_member_role(target_membership, :owner, actor: member)
    end
  end

  defp membership_for(org, user) do
    Membership
    |> Ash.Query.filter(organization_id == ^org.id and user_id == ^user.id)
    |> Ash.read_one!(authorize?: false)
  end

  defp org_with_owner do
    owner = generate(AccountsGenerator.user())
    org = generate(OrgsGenerator.organization(actor: owner))
    {owner, org, membership_for(org, owner)}
  end
end
