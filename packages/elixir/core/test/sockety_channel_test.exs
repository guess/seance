defmodule Seance.SocketyChannelTest do
  use ExUnit.Case

  import Phoenix.ChannelTest
  alias Seance.Test.SocketyChannel
  alias Seance.Test.UserSocket

  @endpoint Seance.Test.Endpoint

  setup do
    start_supervised(@endpoint)
    start_supervised(Phoenix.PubSub.child_spec(name: Seance.Test.PubSub))

    {:ok, _, socket} =
      socket(UserSocket, "wut", %{})
      |> subscribe_and_join(SocketyChannel, "sockety:sock", %{})

    {:ok, %{socket: socket}}
  end

  test "init", %{socket: %{assigns: %{baz: baz}}} do
    assert baz == "bing"

    assert_push(
      "seance:change",
      %{state: %{foo: "bar"}, version: 0}
    )
  end

  test "handle_event", %{socket: socket} do
    push(socket, "seance:event:something_sockety", %{"baz" => "wuzzle"})

    assert_push("seance:patch", %{
      version: 1,
      operations: [%{op: "replace", path: "/foo", value: "altered bar"}]
    })
  end
end
