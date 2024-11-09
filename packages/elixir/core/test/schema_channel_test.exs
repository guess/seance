defmodule Seance.SchemaChanneltest do
  use ExUnit.Case

  import Phoenix.ChannelTest
  alias Seance.Test.SchemaChannel
  alias Seance.Test.UserSocket

  import Seance.TestHelpers

  @endpoint Seance.Test.Endpoint

  setup do
    start_supervised(@endpoint)
    start_supervised(Phoenix.PubSub.child_spec(name: Seance.Test.PubSub))

    {:ok, _, socket} =
      socket(UserSocket, "wut", %{})
      |> subscribe_and_join(SchemaChannel, "foo:all")

    {:ok, %{socket: socket}}
  end

  test "init" do
    assert_push("seance:change", %{state: %{thing: thing}, version: 0})
    assert %{foo: "bar", inserted_at: _date_string} = thing
  end

  test "handle_event", %{socket: socket} do
    send_event(socket, "change_foo", %{"foo" => "not_bar"})

    assert_push("seance:patch", %{
      version: 1,
      operations: patches
    })

    paths = patches |> Enum.map(& &1.path)
    assert "/thing/foo" in paths
    assert "/thing/updated_at" in paths
  end
end
