defmodule RailswitchBackend.Flags.FlagEnvironment.Rules do
  @moduledoc """
  Normalization and validation of the `rules` attribute of a FlagEnvironment.

  The JSON Schema is generated from `js/packages/schemas/src/rules.ts`, which is
  the definition shared with the frontend and the SDK. Regenerate it with
  `mise run //js/packages/schemas:codegen`.
  """

  @schema_path Path.expand("../../../../priv/generated/rules.schema.json", __DIR__)
  @external_resource @schema_path

  @schema @schema_path |> File.read!() |> Jason.decode!() |> ExJsonSchema.Schema.resolve()

  # Without this, validation errors collapse into a single error at the top level.
  # By selecting the schema from the top level `oneOf`, we get more accurate
  # validation errors
  @fragments_by_result_type Map.new(Enum.with_index(@schema.schema["oneOf"]), fn {branch, index} ->
                              {get_in(branch, ["properties", "resultType", "const"]), "#/oneOf/#{index}"}
                            end)

  @doc """
  Trims the whitespace around condition attributes, the way the `trim()` in the
  shared zod schema does.

  `String.trim/1` acts slightly differently between JS and Elixir: JS trims
  U+FEFF (BOM), which Elixir doesn't and Elixir trims U+0085 (NEL). This is
  an acceptable edge case for now.
  """
  def normalize(%{"rules" => rules} = payload) when is_list(rules) do
    %{payload | "rules" => Enum.map(rules, &normalize_rule/1)}
  end

  def normalize(payload), do: payload

  @doc """
  Validates `payload` against the generated JSON Schema.

  Expects an already normalized payload.
  """
  def validate(payload) do
    case fragment_for(payload) do
      nil -> ExJsonSchema.Validator.validate(@schema, payload)
      fragment -> ExJsonSchema.Validator.validate_fragment(@schema, fragment, payload)
    end
  end

  defp fragment_for(%{"resultType" => result_type}), do: Map.get(@fragments_by_result_type, result_type)

  defp fragment_for(_payload), do: nil

  defp normalize_rule(%{"conditions" => group} = rule) when is_map(group) do
    %{rule | "conditions" => normalize_group(group)}
  end

  defp normalize_rule(rule), do: rule

  defp normalize_group(%{"conditions" => conditions} = group) when is_list(conditions) do
    %{group | "conditions" => Enum.map(conditions, &normalize_condition_or_group/1)}
  end

  defp normalize_group(group), do: group

  defp normalize_condition_or_group(%{"combinator" => _combinator} = group), do: normalize_group(group)

  defp normalize_condition_or_group(%{"attribute" => attribute} = condition) when is_binary(attribute),
    do: %{condition | "attribute" => String.trim(attribute)}

  defp normalize_condition_or_group(condition), do: condition
end
