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
  alias RailswitchBackend.Orgs.Errors.NotOrganizationMember
  alias RailswitchBackend.Orgs.Membership
  alias RailswitchBackend.OrgsGenerator

  require Ash.Query

  describe "create" do
    test "adding the same user to an organization twice is rejected" do
      {_owner, org, _} = org_with_owner()
      member = generate(AccountsGenerator.user())

      add_membership(org, member)

      assert {:error, error} = Orgs.add_member(org.id, member.id, authorize?: false)
      assert Exception.message(error) =~ "This user is already a member of this organization"
    end
  end

  describe "change_role" do
    test "an owner can promote a member to owner" do
      {owner, org, _} = org_with_owner()
      member = generate(AccountsGenerator.user())
      membership = add_membership(org, member)

      assert {:ok, updated} =
               Orgs.change_member_role(membership, :owner, actor: owner)

      assert updated.role == :owner
    end

    test "an owner can be demoted while another owner remains" do
      {owner, org, owner_membership} = org_with_owner()
      second = generate(AccountsGenerator.user())
      add_membership(org, second, role: :owner)

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

    test "demoting the last owner is blocked when no other owners have accepted their memberships yet" do
      pending_owner = generate(AccountsGenerator.user())
      declined_owner = generate(AccountsGenerator.user())
      {owner, org, owner_membership} = org_with_owner()

      add_membership(org, pending_owner, role: :owner, status: :pending)
      add_membership(org, declined_owner, role: :owner, status: :declined)

      assert {:error, error} =
               Orgs.change_member_role(owner_membership, :member, actor: owner)

      assert Exception.message(error) =~ "at least one owner"
    end
  end

  describe "destroy" do
    test "an owner can remove a member" do
      {owner, org, _} = org_with_owner()
      member = generate(AccountsGenerator.user())
      membership = add_membership(org, member)

      assert :ok = Orgs.remove_member(membership, actor: owner)
      assert is_nil(membership_for(org, member))
    end

    test "a member can remove themselves" do
      {_owner, org, _} = org_with_owner()
      member = generate(AccountsGenerator.user())
      membership = add_membership(org, member)

      assert :ok = Orgs.remove_member(membership, actor: member)
    end

    test "an owner can leave while another owner remains" do
      {owner, org, owner_membership} = org_with_owner()
      second = generate(AccountsGenerator.user())
      add_membership(org, second, role: :owner)

      assert :ok = Orgs.remove_member(owner_membership, actor: owner)
    end

    test "removing the last owner is blocked" do
      {owner, _org, owner_membership} = org_with_owner()

      assert {:error, error} = Orgs.remove_member(owner_membership, actor: owner)
      assert Exception.message(error) =~ "at least one owner"
    end

    test "the last owner cannot leave when no other owners have accepted their memberships yet" do
      pending_owner = generate(AccountsGenerator.user())
      declined_owner = generate(AccountsGenerator.user())
      {owner, org, owner_membership} = org_with_owner()

      add_membership(org, pending_owner, role: :owner, status: :pending)
      add_membership(org, declined_owner, role: :owner, status: :declined)

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
      {_owner, org, owner_membership} = org_with_owner()
      member = generate(AccountsGenerator.user())
      member_membership = add_membership(org, member)

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

    test "nobody can create a membership directly, not even an owner" do
      {owner, org, _} = org_with_owner()
      member = generate(AccountsGenerator.user())
      add_membership(org, member)

      for actor <- [owner, member] do
        newcomer = generate(AccountsGenerator.user())

        assert {:error, %Forbidden{}} =
                 Orgs.add_member(org.id, newcomer.id, %{status: :accepted},
                   actor: actor,
                   tenant: org.id
                 )

        assert is_nil(membership_for(org, newcomer))
      end
    end

    test "a member cannot remove another member" do
      {_owner, org, _} = org_with_owner()
      member_a = generate(AccountsGenerator.user())
      member_b = generate(AccountsGenerator.user())

      add_membership(org, member_a)
      membership_b = add_membership(org, member_b)

      assert {:error, %Forbidden{}} = Orgs.remove_member(membership_b, actor: member_a)
    end

    test "a non-owner member cannot change a role" do
      {_owner, org, _} = org_with_owner()
      member = generate(AccountsGenerator.user())
      target = generate(AccountsGenerator.user())

      add_membership(org, member)
      target_membership = add_membership(org, target)

      assert {:error, %Forbidden{}} =
               Orgs.change_member_role(target_membership, :owner, actor: member)
    end
  end

  describe "users without an accepted membership" do
    setup ctx do
      {owner, org, owner_membership} = org_with_owner()
      invitee = generate(AccountsGenerator.user())
      invitee_membership = add_membership(org, invitee, status: ctx.status)

      %{
        owner: owner,
        org: org,
        owner_membership: owner_membership,
        invitee: invitee,
        invitee_membership: invitee_membership
      }
    end

    for status <- [:pending, :declined] do
      @tag status: status
      test "a user with a #{status} membership querying with the organization as tenant is not a member",
           ctx do
        assert {:error, %Forbidden{errors: [%NotOrganizationMember{}]}} =
                 Orgs.list_memberships(tenant: ctx.org.id, actor: ctx.invitee)
      end

      @tag status: status
      test "a user with a #{status} membership and preloaded organization ids querying with the organization as tenant is not a member",
           ctx do
        invitee = Ash.load!(ctx.invitee, :organization_ids, authorize?: false)

        assert {:error, %Forbidden{errors: [%NotOrganizationMember{}]}} =
                 Orgs.list_memberships(tenant: ctx.org.id, actor: invitee)
      end

      @tag status: status
      test "a user with a #{status} membership sees only their own membership of the organization",
           ctx do
        assert {:ok, seen} = Orgs.list_memberships(actor: ctx.invitee)

        seen_ids = Enum.map(seen, & &1.id)
        assert ctx.invitee_membership.id in seen_ids
        refute ctx.owner_membership.id in seen_ids
      end

      @tag status: status
      test "members do not see a #{status} membership of their organization", ctx do
        member = generate(AccountsGenerator.user())
        member_membership = add_membership(ctx.org, member)

        assert {:ok, seen} = Orgs.list_memberships(tenant: ctx.org.id, actor: member)

        seen_ids = Enum.map(seen, & &1.id)
        assert ctx.owner_membership.id in seen_ids
        assert member_membership.id in seen_ids
        refute ctx.invitee_membership.id in seen_ids
      end

      @tag status: status
      test "owners do not see a #{status} membership of their organization", ctx do
        assert {:ok, seen} = Orgs.list_memberships(tenant: ctx.org.id, actor: ctx.owner)

        seen_ids = Enum.map(seen, & &1.id)
        assert ctx.owner_membership.id in seen_ids
        refute ctx.invitee_membership.id in seen_ids
      end

      @tag status: status
      test "an owner cannot change the role of a #{status} membership", ctx do
        assert {:error, %Forbidden{}} =
                 Orgs.change_member_role(ctx.invitee_membership, :owner, actor: ctx.owner)

        assert membership_for(ctx.org, ctx.invitee).role == :member
      end

      @tag status: status
      test "an owner cannot remove a #{status} membership", ctx do
        assert {:error, %Forbidden{}} =
                 Orgs.remove_member(ctx.invitee_membership, actor: ctx.owner)

        assert membership_for(ctx.org, ctx.invitee)
      end

      @tag status: status
      test "a user cannot remove their own #{status} membership", ctx do
        assert {:error, %Forbidden{}} =
                 Orgs.remove_member(ctx.invitee_membership, actor: ctx.invitee)

        assert membership_for(ctx.org, ctx.invitee)
      end
    end
  end

  defp membership_for(org, user) do
    Membership
    |> Ash.Query.filter(organization_id == ^org.id and user_id == ^user.id)
    |> Ash.read_one!(authorize?: false)
  end

  defp add_membership(org, user, overrides \\ []) do
    generate(OrgsGenerator.membership([organization_id: org.id, user_id: user.id] ++ overrides))
  end

  defp org_with_owner do
    owner = generate(AccountsGenerator.user())
    org = generate(OrgsGenerator.organization(actor: owner))
    {owner, org, membership_for(org, owner)}
  end
end
