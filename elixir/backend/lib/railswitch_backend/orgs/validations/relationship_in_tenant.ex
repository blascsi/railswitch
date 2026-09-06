defmodule RailswitchBackend.Orgs.Validations.RelationshipInTenant do
  @moduledoc """
  Asserts that the records a request names live in the organization it acts in.

  Without this, a request could create a row in that organization that points
  at a record in a different one.
  """

  use Ash.Resource.Validation

  alias Ash.Error.Changes.InvalidAttribute

  require Ash.Query

  @opt_schema [
    relationships: [
      type: {:list, :atom},
      required: true,
      doc: "The `belongs_to` relationships whose target must live in the tenant"
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
  def describe(_opts), do: "the referenced records belong to the requested organization"

  # No tenant, nothing to check the references against.
  @impl true
  def validate(_changeset, _opts, %{tenant: nil}), do: :ok

  def validate(changeset, opts, context) do
    Enum.reduce_while(opts[:relationships], :ok, fn name, :ok ->
      case validate_relationship(changeset, name, context) do
        :ok -> {:cont, :ok}
        {:error, error} -> {:halt, {:error, error}}
      end
    end)
  end

  defp validate_relationship(changeset, name, context) do
    relationship = Ash.Resource.Info.relationship(changeset.resource, name)

    # Reading both keeps this independent of any `set_attribute` ordering.
    case Ash.Changeset.get_argument_or_attribute(changeset, relationship.source_attribute) do
      nil -> :ok
      value -> in_tenant(relationship, value, context)
    end
  end

  defp in_tenant(relationship, value, context) do
    relationship.destination
    |> Ash.Query.filter(id == ^value)
    |> Ash.exists(tenant: context.tenant, actor: context.actor, authorize?: context.authorize?)
    |> case do
      {:ok, true} ->
        :ok

      {:ok, false} ->
        {:error,
         InvalidAttribute.exception(
           field: relationship.source_attribute,
           message: "does not exist"
         )}

      # A bad tenant is the request's failure, not the field's.
      {:error, error} ->
        {:error, error}
    end
  end
end
