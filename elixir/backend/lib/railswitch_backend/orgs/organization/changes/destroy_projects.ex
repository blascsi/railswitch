defmodule RailswitchBackend.Orgs.Organization.Changes.DestroyProjects do
  @moduledoc """
  Destroys the organization's projects through Ash before the organization row
  is deleted, so the pub_sub notifications on their child resources fire.
  The Postgres cascade would remove them silently, leaving SDK
  clients streaming flags for a deleted organization.

  `cascade_destroy/2` can't be used here. It reads its related query with the
  change context's tenant, and deleting an organization is not scoped to one:
  callers address the org by id and send no `x-organization-id` header. The
  tenant is the organization's own id, so it is passed explicitly — which also
  works on the bulk path, where the change context is built by the bulk
  machinery rather than from the changeset.
  """

  use Ash.Resource.Change

  @impl true
  def change(changeset, _opts, context) do
    Ash.Changeset.before_action(changeset, &destroy_projects(&1, context))
  end

  defp destroy_projects(changeset, context) do
    organization_id = changeset.data.id

    result =
      RailswitchBackend.Flags.Project
      |> Ash.Query.new()
      |> Ash.bulk_destroy(
        :destroy,
        %{},
        Keyword.merge(Ash.Context.to_opts(context),
          tenant: organization_id,
          strategy: [:stream, :atomic, :atomic_batches],
          return_errors?: true,
          stop_on_error?: true,
          notify?: true,
          return_notifications?: true
        )
      )

    case result do
      %Ash.BulkResult{status: :success, notifications: notifications} ->
        {changeset, %{notifications: List.wrap(notifications)}}

      %Ash.BulkResult{errors: [_ | _] = errors} ->
        Ash.Changeset.add_error(changeset, Ash.Error.to_ash_error(errors))

      %Ash.BulkResult{} ->
        Ash.Changeset.add_error(changeset, "destroying the organization's projects failed")
    end
  end
end
