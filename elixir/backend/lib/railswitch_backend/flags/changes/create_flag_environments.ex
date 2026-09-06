defmodule RailswitchBackend.Flags.Changes.CreateFlagEnvironments do
  @moduledoc """
    A change that automatically creates the FlagEnvironment resources when a `Flag`
    or an `Environment` resource is created.
  """

  use Ash.Resource.Change

  @impl true
  def init(opts) do
    if opts[:type] not in [:flag, :environment] do
      raise ArgumentError, "CreateFlagEnvironments requires type: :flag or :environment"
    end

    {:ok, opts}
  end

  @impl true
  def change(changeset, opts, context) do
    Ash.Changeset.after_action(changeset, fn _changeset, record ->
      scope_opts = Ash.Scope.to_opts(context)

      lock_project(record, scope_opts)

      case build_inputs(opts[:type], record, scope_opts) do
        [] -> {:ok, record}
        inputs -> create_flag_environments(inputs, record, scope_opts)
      end
    end)
  end

  defp create_flag_environments(inputs, record, scope_opts) do
    result =
      Ash.bulk_create(
        inputs,
        RailswitchBackend.Flags.FlagEnvironment,
        :create,
        Keyword.merge(scope_opts,
          return_errors?: true,
          stop_on_error?: true,
          notify?: true,
          return_notifications?: true
        )
      )

    case result do
      %Ash.BulkResult{status: :success, notifications: notifications} ->
        {:ok, record, List.wrap(notifications)}

      %Ash.BulkResult{errors: [_ | _] = errors} ->
        {:error, Ash.Error.to_ash_error(errors)}

      %Ash.BulkResult{} ->
        {:error, "creating flag environments failed"}
    end
  end

  # Both this change on Flag and on Environment read the sibling resource and
  # then insert the join rows. Two concurrent creations in the same project
  # could each miss the other's uncommitted record, so we serialize them by
  # locking the project row for the duration of the surrounding transaction.
  #
  # The lock skips authorization, and tenant verification: it is an internal
  # implementation detail, and the parent create action already enforces its own policies.
  defp lock_project(record, scope_opts) do
    Ash.get!(
      RailswitchBackend.Flags.Project,
      record.project_id,
      scope_opts |> Keyword.put(:lock, :for_update) |> Keyword.put(:authorize?, false)
    )
  end

  defp build_inputs(:flag, flag, scope_opts) do
    [query: [filter: [project_id: flag.project_id]]]
    |> Keyword.merge(scope_opts)
    |> RailswitchBackend.Flags.list_environments!()
    |> Enum.map(fn env -> %{flag_id: flag.id, environment_id: env.id} end)
  end

  defp build_inputs(:environment, environment, scope_opts) do
    [query: [filter: [project_id: environment.project_id]]]
    |> Keyword.merge(scope_opts)
    |> RailswitchBackend.Flags.list_flags!()
    |> Enum.map(fn flag -> %{flag_id: flag.id, environment_id: environment.id} end)
  end
end
