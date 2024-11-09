defmodule Seance.SeanceChannelTest do
  use ExUnit.Case

  import Phoenix.ChannelTest
  alias Seance.Test.TodoChannel
  alias Seance.Test.UserSocket

  import Seance.TestHelpers

  @endpoint Seance.Test.Endpoint

  setup do
    start_supervised(@endpoint)
    start_supervised(Phoenix.PubSub.child_spec(name: Seance.Test.PubSub))

    {:ok, _, socket} =
      socket(UserSocket, "wut", %{})
      |> subscribe_and_join(TodoChannel, "todos:all", %{"token" => "footoken"})

    {:ok, %{socket: socket}}
  end

  test "init" do
    assert_push(
      "seance:change",
      %{state: %{todos: [], token: "footoken"}, version: 0}
    )
  end

  test "handle_event", %{socket: socket} do
    send_event(socket, "add_todo", %{"description" => "Do the thing"})
    assert_state_change(%{todos: [%{"description" => "Do the thing"}]})
  end

  test "handle_message" do
    Phoenix.PubSub.broadcast(
      Seance.Test.PubSub,
      "todos",
      {:todo_added, %{"description" => "And another one"}}
    )

    assert_push("seance:event", %Seance.Event{detail: %{foo: "bar"}, name: "reply_event"})

    assert_push("seance:change", %{
      state: %{todos: [%{"description" => "And another one"}]},
      version: 1
    })
  end

  test "handle_event with reply", %{socket: socket} do
    push(socket, "seance:event:add_todo_with_one_reply", %{"description" => "Do the thing"})

    assert_push("seance:change", %{
      state: %{todos: [%{"description" => "Do the thing"}]},
      version: 1
    })

    assert_push("seance:event", %Seance.Event{detail: %{foo: "bar"}, name: "reply_event"})
  end

  test "handle_event with multi event reply", %{socket: socket} do
    push(socket, "seance:event:add_todo_with_two_replies", %{"description" => "Do the thing"})

    assert_push("seance:change", %{
      state: %{todos: [%{"description" => "Do the thing"}]},
      version: 1
    })

    assert_push("seance:event", %Seance.Event{detail: %{foo: "bar"}, name: "reply_event1"})
    assert_push("seance:event", %Seance.Event{detail: %{bing: "baz"}, name: "reply_event2"})
  end
end
