defmodule RailswitchBackend.Flags.FlagEnvironment.RulesTest do
  @moduledoc """
  Tests for `RailswitchBackend.Flags.FlagEnvironment.Rules`, the normalization
  and validation shared with the frontend's zod schema.
  """
  use ExUnit.Case, async: true

  alias RailswitchBackend.Flags.FlagEnvironment.Defaults
  alias RailswitchBackend.Flags.FlagEnvironment.Rules

  defp rules_with(conditions, result_type \\ "string", value \\ "matched") do
    %{
      "resultType" => result_type,
      "rules" => [
        %{
          "enabled" => true,
          "conditions" => %{"combinator" => "and", "conditions" => conditions},
          "result" => %{"type" => "value", "value" => value}
        }
      ]
    }
  end

  defp condition(overrides) do
    Map.merge(%{"type" => "attribute", "attribute" => "plan"}, overrides)
  end

  defp validate(payload), do: payload |> Rules.normalize() |> Rules.validate()

  describe "validate/1" do
    test "accepts the default rules a flag environment is created with" do
      assert :ok = validate(Defaults.rules())
    end

    test "accepts every result type" do
      for {result_type, value} <- [{"string", "a"}, {"number", 1}, {"boolean", true}] do
        assert :ok = validate(rules_with([], result_type, value))
      end
    end

    test "rejects a result value that does not match the result type" do
      assert {:error, _errors} = validate(rules_with([], "number", "not_a_number"))
    end

    test "accepts value operators paired with a comparable value" do
      for {operator, value} <- [
            {"eq", "pro"},
            {"neq", 2},
            {"gt", 1},
            {"lte", 1.5},
            {"contains", "pr"},
            {"not_contains", "pr"}
          ] do
        assert :ok =
                 validate(rules_with([condition(%{"operator" => operator, "value" => value})])),
               "expected #{operator} with #{inspect(value)} to be accepted"
      end
    end

    test "rejects a value operator whose value it can never compare against" do
      for {operator, value} <- [
            {"gt", "100"},
            {"lte", true},
            {"contains", 5},
            {"not_contains", nil},
            {"eq", %{"nested" => true}}
          ] do
        assert {:error, _errors} =
                 validate(rules_with([condition(%{"operator" => operator, "value" => value})])),
               "expected #{operator} with #{inspect(value)} to be rejected"
      end
    end

    test "rejects a value operator that is missing its value" do
      assert {:error, _errors} = validate(rules_with([condition(%{"operator" => "eq"})]))
    end

    test "accepts valueless operators without a value" do
      for operator <- ["exists", "not_exists", "is_true", "is_false"] do
        assert :ok = validate(rules_with([condition(%{"operator" => operator})])),
               "expected #{operator} to be accepted"
      end
    end

    test "rejects a valueless operator carrying a stray value" do
      assert {:error, _errors} =
               validate(rules_with([condition(%{"operator" => "exists", "value" => "junk"})]))
    end

    test "rejects unknown operators, combinators and condition types" do
      assert {:error, _errors} = validate(rules_with([condition(%{"operator" => "bogus"})]))

      assert {:error, _errors} =
               validate(%{
                 "resultType" => "string",
                 "rules" => [
                   %{
                     "enabled" => true,
                     "conditions" => %{"combinator" => "xor", "conditions" => []},
                     "result" => %{"type" => "value", "value" => "a"}
                   }
                 ]
               })

      assert {:error, _errors} =
               validate(rules_with([%{"type" => "segment", "operator" => "exists"}]))
    end

    test "accepts nested condition groups" do
      nested = %{
        "combinator" => "or",
        "conditions" => [condition(%{"operator" => "exists"})]
      }

      assert :ok = validate(rules_with([nested]))
    end

    test "rejects unknown keys" do
      assert {:error, _errors} =
               validate(rules_with([condition(%{"operator" => "exists", "surprise" => 1})]))
    end

    test "reports the path of the offending condition rather than the document root" do
      assert {:error, errors} =
               validate(rules_with([condition(%{"operator" => "gt", "value" => "100"})]))

      assert Enum.any?(errors, fn {_message, path} ->
               path == "#/rules/0/conditions/conditions/0"
             end)
    end

    test "rejects a payload whose resultType is unknown" do
      assert {:error, _errors} = validate(rules_with([], "date", "2026-01-01"))
    end
  end

  describe "normalize/1" do
    test "trims the whitespace around condition attributes" do
      normalized =
        Rules.normalize(rules_with([condition(%{"attribute" => "  plan  ", "operator" => "exists"})]))

      assert %{"rules" => [%{"conditions" => %{"conditions" => [condition]}}]} = normalized
      assert condition["attribute"] == "plan"
    end

    test "trims attributes inside nested condition groups" do
      nested = %{
        "combinator" => "or",
        "conditions" => [condition(%{"attribute" => " tier ", "operator" => "exists"})]
      }

      normalized = Rules.normalize(rules_with([nested]))

      assert %{"rules" => [%{"conditions" => %{"conditions" => [group]}}]} = normalized
      assert [%{"attribute" => "tier"}] = group["conditions"]
    end

    test "an attribute of only whitespace normalizes to one the schema rejects" do
      assert {:error, _errors} =
               validate(rules_with([condition(%{"attribute" => "   ", "operator" => "exists"})]))
    end

    test "passes malformed payloads through untouched, for validation to reject" do
      for payload <- [%{}, %{"rules" => "not_a_list"}, %{"rules" => [%{"conditions" => 1}]}] do
        assert Rules.normalize(payload) == payload
      end
    end
  end
end
