defmodule RailswitchBackend.Orgs.Validations.ArgumentIsTenant do
  @moduledoc """
  Asserts that an argument naming an organization matches the tenant.

  The sibling of `RelationshipInTenant`, for arguments that *are* the
  organization rather than a reference to something inside it.
  Without this a mismatched argument would be ignored instead of refused.
  """

  use Ash.Resource.Validation

  alias Ash.Error.Changes.InvalidAttribute

  @opt_schema [
    arguments: [
      type: {:list, :atom},
      required: true,
      doc: "The arguments carrying an organization id, which must be the tenant"
    ]
  ]

  @impl true
  def init(opts) do
    case Spark.Options.validate(opts, @opt_schema) do
      {:ok, opts} -> {:ok, opts}
      {:error, error} -> {:error, Exception.message(error)}
    end
  end

  @impl true
  def describe(_opts), do: "the named organization is the requested organization"

  # No tenant, nothing to compare against.
  @impl true
  def validate(_changeset, _opts, %{tenant: nil}), do: :ok

  def validate(changeset, opts, context) do
    Enum.reduce_while(opts[:arguments], :ok, fn name, :ok ->
      case validate_argument(changeset, name, context) do
        :ok -> {:cont, :ok}
        {:error, error} -> {:halt, {:error, error}}
      end
    end)
  end

  defp validate_argument(changeset, name, context) do
    value = Ash.Changeset.get_argument_or_attribute(changeset, name)

    if is_nil(value) or to_string(value) == to_string(context.tenant) do
      :ok
    else
      {:error,
       InvalidAttribute.exception(
         field: name,
         message: "does not match the organization this request is scoped to"
       )}
    end
  end
end
