defmodule RailswitchBackend.Mailer do
  @moduledoc false

  use Swoosh.Mailer, otp_app: :railswitch_backend

  def sender do
    from_address =
      :railswitch_backend
      |> Application.fetch_env!(__MODULE__)
      |> Keyword.fetch!(:from_address)

    {"Railswitch", from_address}
  end
end
