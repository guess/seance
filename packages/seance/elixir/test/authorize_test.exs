defmodule Seance.AuthorizeTest do
  use ExUnit.Case

  import Phoenix.ChannelTest
  alias Seance.Test.UserSocket

  @endpoint Seance.Test.Endpoint

  setup do
    start_supervised(@endpoint)
    start_supervised(Phoenix.PubSub.child_spec(name: Seance.Test.PubSub))

    {:ok, %{socket: socket(UserSocket, "wut", %{})}}
  end

  test "successful join", %{socket: socket} do
    assert {:ok, _result, _socket} =
             socket |> subscribe_and_join("authorized:all", %{"password" => "secret"})

    assert_push("seance:change", %{state: %{authorized: true}, version: 0})
  end

  test "unsuccessful join", %{socket: socket} do
    assert {:error, reason} =
             socket |> subscribe_and_join("authorized:all", %{"password" => "garbage"})

    assert reason == "Go away!"
  end
end
