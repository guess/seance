defmodule Seance.JSONPatchTest do
  use ExUnit.Case

  import Phoenix.ChannelTest
  alias Seance.Test.PatchChannel
  alias Seance.Test.UserSocket

  import Seance.TestHelpers

  @endpoint Seance.Test.Endpoint

  setup do
    start_supervised(@endpoint)
    start_supervised(Phoenix.PubSub.child_spec(name: Seance.Test.PubSub))

    {:ok, _, socket} =
      socket(UserSocket, "wut", %{})
      |> subscribe_and_join(PatchChannel, "foo:all")

    {:ok, %{socket: socket}}
  end

  test "init" do
    assert_push("seance:change", %{state: %{foo: "bar"}, version: 0})
  end

  test "handle_event", %{socket: socket} do
    send_event(socket, "change_foo", %{"foo" => "not_bar"})
    assert_state_patch([%{op: "replace", path: "/foo", value: "not_bar"}])
  end

  test "version rollover", %{socket: socket} do
    Enum.each(0..11, fn i -> push(socket, "seance:event:change_foo", %{"foo" => "bar #{i}"}) end)

    assert_push("seance:patch", %{
      operations: [%{op: "replace", path: "/foo", value: "bar 11"}],
      version: 1
    })
  end
end
