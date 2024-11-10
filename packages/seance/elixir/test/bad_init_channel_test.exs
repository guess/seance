defmodule Seance.BadInitChannelTest do
  use ExUnit.Case

  import Phoenix.ChannelTest
  alias Seance.Test.BadInitChannel
  alias Seance.Test.UserSocket

  @endpoint Seance.Test.Endpoint

  setup do
    start_supervised(@endpoint)
    start_supervised(Phoenix.PubSub.child_spec(name: Seance.Test.PubSub))

    {:ok, _, socket} =
      socket(UserSocket, "wut", %{})
      |> subscribe_and_join(BadInitChannel, "wutever", %{})

    {:ok, %{socket: socket}}
  end

  test "init" do
    assert_push(
      "seance:error",
      %{message: "you stink"}
    )
  end
end
