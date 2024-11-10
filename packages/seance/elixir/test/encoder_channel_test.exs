defmodule Seance.EncoderChannelTest do
  use ExUnit.Case

  import Phoenix.ChannelTest
  alias Seance.Test.EncoderChannel
  alias Seance.Test.UserSocket

  import Seance.TestHelpers

  @endpoint Seance.Test.Endpoint

  setup do
    start_supervised(@endpoint)
    start_supervised(Phoenix.PubSub.child_spec(name: Seance.Test.PubSub))

    {:ok, _, socket} =
      socket(UserSocket, "wut", %{})
      |> subscribe_and_join(EncoderChannel, "foo:all")

    {:ok, %{socket: socket}}
  end

  test "init" do
    assert_push("seance:change", %{state: %{thing: thing}, version: 0})
    assert thing == %{bing: "baz", baz: "bing"}
  end

  test "handle_event", %{socket: socket} do
    send_event(socket, "change_baz", %{"baz" => "not_bing"})

    assert_push("seance:patch", %{
      version: 1,
      operations: [%{op: "replace", path: "/thing/baz", value: "not_bing"}]
    })
  end
end
