defmodule RailswitchBackend.Flags.FlagEnvironmentTest do
  @moduledoc """
  Action tests for `RailswitchBackend.Flags.FlagEnvironment`.
  """
  use RailswitchBackend.DataCase, async: true

  import Ash.Generator

  alias Ash.Error.Changes.InvalidAttribute
  alias Ash.Error.Forbidden
  alias Ash.Error.Invalid
  alias RailswitchBackend.AccountsGenerator
  alias RailswitchBackend.Flags
  alias RailswitchBackend.FlagsGenerator
  alias RailswitchBackend.Orgs.Errors.NotOrganizationMember
  alias RailswitchBackend.OrgsGenerator

  setup do
    user = generate(AccountsGenerator.user())
    org = generate(OrgsGenerator.organization(actor: user))
    project = generate(FlagsGenerator.project(tenant: org.id))
    environment = generate(FlagsGenerator.environment(tenant: org.id, project_id: project.id))

    flag = generate(FlagsGenerator.flag(tenant: org.id, project_id: project.id))

    [flag_environment] =
      Flags.list_flag_environments!(
        query: [filter: [flag_id: flag.id, environment_id: environment.id]],
        tenant: org.id,
        actor: user
      )

    outsider = generate(AccountsGenerator.user())

    %{
      user: user,
      org: org,
      project: project,
      environment: environment,
      flag: flag,
      flag_environment: flag_environment,
      outsider: outsider
    }
  end

  describe "list_flag_environments" do
    test "returns the organization's flag environments to a member", ctx do
      assert {:ok, [found]} =
               Flags.list_flag_environments(
                 query: [filter: [id: ctx.flag_environment.id]],
                 tenant: ctx.org.id,
                 actor: ctx.user
               )

      assert found.id == ctx.flag_environment.id
    end

    test "policy - an outsider is refused", ctx do
      assert {:error, %Forbidden{errors: [%NotOrganizationMember{}]}} =
               Flags.list_flag_environments(
                 query: [filter: [id: ctx.flag_environment.id]],
                 tenant: ctx.org.id,
                 actor: ctx.outsider
               )
    end

    test "policy - a request without an actor is refused", ctx do
      assert {:error, %Forbidden{errors: [%NotOrganizationMember{}]}} =
               Flags.list_flag_environments(
                 query: [filter: [id: ctx.flag_environment.id]],
                 tenant: ctx.org.id
               )
    end

    for status <- [:pending, :declined] do
      @tag status: status
      test "policy - a user with a #{status} membership is refused", ctx do
        invitee = generate(AccountsGenerator.user())

        generate(
          OrgsGenerator.membership(
            organization_id: ctx.org.id,
            user_id: invitee.id,
            status: ctx.status
          )
        )

        assert {:error, %Forbidden{errors: [%NotOrganizationMember{}]}} =
                 Flags.list_flag_environments(
                   query: [filter: [id: ctx.flag_environment.id]],
                   tenant: ctx.org.id,
                   actor: invitee
                 )
      end
    end
  end

  describe "update_flag_environment" do
    test "updates the rules for a member", ctx do
      assert {:ok, updated} =
               Flags.update_flag_environment(
                 ctx.flag_environment,
                 %{rules: FlagsGenerator.disabled_rules()},
                 tenant: ctx.org.id,
                 actor: ctx.user
               )

      assert updated.rules == FlagsGenerator.disabled_rules()
    end

    test "rejects rules that do not match the shared schema", ctx do
      # `gt` operator can't be used with a string `value`
      invalid = %{
        "resultType" => "string",
        "rules" => [
          %{
            "enabled" => true,
            "conditions" => %{
              "combinator" => "and",
              "conditions" => [
                %{
                  "type" => "attribute",
                  "attribute" => "points",
                  "operator" => "gt",
                  "value" => "100"
                }
              ]
            },
            "result" => %{"type" => "value", "value" => "matched"}
          }
        ]
      }

      assert {:error, %Invalid{errors: errors}} =
               Flags.update_flag_environment(
                 ctx.flag_environment,
                 %{rules: invalid},
                 tenant: ctx.org.id,
                 actor: ctx.user
               )

      assert Enum.any?(errors, fn error ->
               match?(%InvalidAttribute{field: :rules}, error)
             end)
    end

    test "trims condition attributes before storing them", ctx do
      rules = %{
        "resultType" => "boolean",
        "rules" => [
          %{
            "enabled" => true,
            "conditions" => %{
              "combinator" => "and",
              "conditions" => [
                %{"type" => "attribute", "attribute" => "  plan  ", "operator" => "exists"}
              ]
            },
            "result" => %{"type" => "value", "value" => true}
          }
        ]
      }

      assert {:ok, updated} =
               Flags.update_flag_environment(
                 ctx.flag_environment,
                 %{rules: rules},
                 tenant: ctx.org.id,
                 actor: ctx.user
               )

      assert %{"rules" => [%{"conditions" => %{"conditions" => [condition]}}]} = updated.rules
      assert condition["attribute"] == "plan"
    end

    test "policy - an outsider is refused", ctx do
      assert {:error, %Forbidden{}} =
               Flags.update_flag_environment(
                 ctx.flag_environment,
                 %{rules: FlagsGenerator.disabled_rules()},
                 tenant: ctx.org.id,
                 actor: ctx.outsider
               )
    end

    test "policy - a request without an actor is refused", ctx do
      assert {:error, %Forbidden{}} =
               Flags.update_flag_environment(
                 ctx.flag_environment,
                 %{rules: FlagsGenerator.disabled_rules()},
                 tenant: ctx.org.id
               )
    end

    for status <- [:pending, :declined] do
      @tag status: status
      test "policy - a user with a #{status} membership is refused", ctx do
        invitee = generate(AccountsGenerator.user())

        generate(
          OrgsGenerator.membership(
            organization_id: ctx.org.id,
            user_id: invitee.id,
            status: ctx.status
          )
        )

        assert {:error, %Forbidden{}} =
                 Flags.update_flag_environment(
                   ctx.flag_environment,
                   %{rules: FlagsGenerator.disabled_rules()},
                   tenant: ctx.org.id,
                   actor: invitee
                 )
      end
    end
  end
end
