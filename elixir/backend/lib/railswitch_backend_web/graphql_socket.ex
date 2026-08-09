defmodule RailswitchBackendWeb.GraphqlSocket do
  use Phoenix.Socket

  use Absinthe.Phoenix.Socket,
    schema: RailswitchBackendWeb.GraphqlSchema

  # Fail all subscriptions for now. No feature depends on subscriptions yet
  # and authentication is not straightforward to implement yet, though
  # shouldn't be super hard to add.
  @impl true
  def connect(_params, _socket, _connect_info) do
    :error
  end

  @impl true
  def id(_socket), do: nil
end
