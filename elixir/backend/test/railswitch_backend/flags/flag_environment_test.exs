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

    flag =
      Flags.create_flag!(%{name: "checkout", project_id: project.id}, tenant: org.id, actor: user)

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

  describe "read" do
    test "a member can list flag environments", ctx do
      assert {:ok, [found]} =
               Flags.list_flag_environments(
                 query: [filter: [id: ctx.flag_environment.id]],
                 tenant: ctx.org.id,
                 actor: ctx.user
               )

      assert found.id == ctx.flag_environment.id
    end

    test "an outsider cannot list flag environments", ctx do
      assert {:error, %Forbidden{errors: [%NotOrganizationMember{}]}} =
               Flags.list_flag_environments(
                 query: [filter: [id: ctx.flag_environment.id]],
                 tenant: ctx.org.id,
                 actor: ctx.outsider
               )
    end

    test "a request without an actor cannot list flag environments", ctx do
      assert {:error, %Forbidden{errors: [%NotOrganizationMember{}]}} =
               Flags.list_flag_environments(
                 query: [filter: [id: ctx.flag_environment.id]],
                 tenant: ctx.org.id
               )
    end
  end

  describe "update" do
    test "a member can update the rules", ctx do
      assert {:ok, updated} =
               Flags.update_flag_environment(
                 ctx.flag_environment,
                 %{rules: FlagsGenerator.disabled_rules()},
                 tenant: ctx.org.id,
                 actor: ctx.user
               )

      assert updated.rules == FlagsGenerator.disabled_rules()
    end

    test "an outsider cannot update the rules", ctx do
      assert {:error, %Forbidden{}} =
               Flags.update_flag_environment(
                 ctx.flag_environment,
                 %{rules: FlagsGenerator.disabled_rules()},
                 tenant: ctx.org.id,
                 actor: ctx.outsider
               )
    end

    test "a request without an actor cannot update the rules", ctx do
      assert {:error, %Forbidden{}} =
               Flags.update_flag_environment(
                 ctx.flag_environment,
                 %{rules: FlagsGenerator.disabled_rules()},
                 tenant: ctx.org.id
               )
    end

    test "rules that do not match the shared schema are rejected", ctx do
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

    test "condition attributes are trimmed before being stored", ctx do
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
  end
end
