defmodule RailswitchBackendWeb.ChannelCase do
  @moduledoc """
  This module defines the test case to be used by tests that require setting
  up a channel or socket.
  """

  use ExUnit.CaseTemplate

  using do
    quote do
      import Phoenix.ChannelTest
      import RailswitchBackendWeb.ChannelCase

      # The default endpoint for testing
      @endpoint RailswitchBackendWeb.Endpoint
    end
  end

  setup tags do
    RailswitchBackend.DataCase.setup_sandbox(tags)
    :ok
  end
end
