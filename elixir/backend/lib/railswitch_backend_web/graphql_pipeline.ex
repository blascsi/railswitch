defmodule RailswitchBackendWeb.GraphqlPipeline do
  @moduledoc """
  The Absinthe document pipeline, with spec-compliant error rendering.
  """

  alias Absinthe.Phase.Document.Result

  def pipeline(config, opts) do
    config
    |> Absinthe.Plug.default_pipeline(opts)
    |> Absinthe.Pipeline.replace(
      Result,
      {Result, spec_compliant_errors: true}
    )
  end
end
