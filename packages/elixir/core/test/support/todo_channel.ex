defmodule Seance.Test.TodoChannel do
  @moduledoc false

  alias Seance.MessageBuilder

  defmodule MyMessageBuilder do
    @moduledoc false
    def update_state_message(_current_state, new_state, version),
      do: MessageBuilder.new_state_message(new_state, version)

    def new_state_message(new_state, version),
      do: MessageBuilder.new_state_message(new_state, version)
  end

  alias Seance.MessageBuilder

  use Seance.Channel,
    web_module: Seance.Test.Web,
    message_builder: MyMessageBuilder

  alias Seance.Event

  @impl true
  def init(_channel, %{"token" => token}, _socket) do
    Phoenix.PubSub.subscribe(Seance.Test.PubSub, "todos")
    {:ok, %{todos: [], token: token}}
  end

  @impl true
  def handle_event("add_todo", todo, %{todos: todos}) do
    {:noreply, %{todos: [todo | todos]}}
  end

  @impl true
  def handle_event("add_todo_with_one_reply", todo, %{todos: todos}) do
    {:reply, %Event{name: "reply_event", detail: %{foo: "bar"}}, %{todos: [todo | todos]}}
  end

  @impl true
  def handle_event("add_todo_with_two_replies", todo, %{todos: todos}) do
    {:reply,
     [
       %Event{name: "reply_event1", detail: %{foo: "bar"}},
       %Event{name: "reply_event2", detail: %{bing: "baz"}}
     ], %{todos: [todo | todos]}}
  end

  @impl true
  def handle_message({:todo_added, todo}, %{todos: todos}) do
    {:reply, %Event{name: "reply_event", detail: %{foo: "bar"}}, %{todos: [todo | todos]}}
  end
end
