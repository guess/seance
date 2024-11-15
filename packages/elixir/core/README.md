# Seance

[![CI](https://github.com/guess/seance/actions/workflows/ci.yml/badge.svg)](https://github.com/guess/seance/actions/workflows/ci.yml)
[![License](https://img.shields.io/hexpm/l/seance.svg)](https://github.com/guess/seance/blob/main/LICENSE.md)
[![Version](https://img.shields.io/hexpm/v/seance.svg)](https://hex.pm/packages/seance)
[![Hex Docs](https://img.shields.io/badge/documentation-gray.svg)](https://hexdocs.pm/seance)

Seance is an Elixir library for building servers that power interactive web and mobile applications. It offers an alternative approach to state management and client-server communication, particularly suited for applications that don't rely on server-side HTML rendering.

## Key Concepts

- **Centralized State Management**: Application state is maintained on the server, reducing complexity in state synchronization.
- **Event-Driven Architecture**: Clients dispatch events to the server, which handles them and updates the state accordingly.
- **Real-Time Updates**: The server pushes state changes to clients, facilitating real-time interactivity.
- **Simplified Client Logic**: Client-side code primarily focuses on rendering state and dispatching events.
- **Platform Agnostic**: Suitable for web applications and mobile apps that manage their own UI rendering.

## How It Works

1. Clients send events to the server
2. The server processes events and updates the application state
3. Updated state is sent back to clients for rendering

This approach aims to reduce the complexity often found in managing state across both client and server in traditional web and mobile applications.

## Use Cases

Seance is particularly well-suited for:

- Mobile applications that handle their own UI rendering
- Web applications requiring real-time updates
- Scenarios where a unified backend can serve multiple client types (web, mobile, etc.)

## Comparison to LiveView

While Seance shares similar goals with Phoenix LiveView, it takes a different approach:

- LiveView manages both server logic and view presentation in Elixir, primarily for web applications
- Seance handles server logic in Elixir but relies on client-side code for rendering, making it adaptable for both web and mobile platforms

This distinction allows Seance to be used in scenarios where full server-side rendering is not possible or desirable, such as in native mobile applications.

## Installation

This package can be installed
by adding `seance` to your list of dependencies in `mix.exs`:

```elixir
def deps do
  [
    {:seance, "~> 0.1"},
    {:cors_plug, "~> 3.0"}
  ]
end
```

While `cors_plug` is not strictly required, you will very likely want it to be able to add to your endpoint so that
clients cannot connect to your channel.

## Usage

First you need to set up a socket as you would with other normal [Phoenix Channels](https://hexdocs.pm/phoenix/channels.html)

1. On your Endpoint module, set up a socket for your channel:

```elixir
defmodule DemoWeb.Endpoint do
  socket "/manifest", DemoWeb.Socket
...
```

2. Then create the socket module with the topic to listen to:

```elixir
defmodule DemoWeb.Socket do
  use Phoenix.Socket

  channel "topic", DemoWeb.Channel
  @impl true
  def connect(_params, socket), do: {:ok, socket}

  @impl true
  def id(_), do: "random_id"
end
```

3. Create your channel using the `Seance.Channel` behaviour:

```elixir
defmodule DemoWeb.Channel do
  use Seance.Channel, web_module: DemoWeb
...
```

4. Then define your initial state using the `c:Seance.Channel.init/3` callback, which will be called after channel joins and is expected to return the initial state:

```elixir
def init(_channel, _payload, _socket), do: {:ok, %{foo: "bar"}}
```

State must be a map. It will be sent down as JSON, so anything in it
must have a `Jason.Encoder` implementation.

## Events

For events emitted from the client, you implement the `c:Seance.Channel.handle_event/3` callback. If you need access the socket in your event handler, you may implement
`c:Seance.Channel.handle_event/4`.

```elixir
  def handle_event("add_todo", todo, %{todos: todos}) do
    {:noreply, %{todos: [todo | todos]}}
  end
```

`c:Seance.Channel.handle_event/3` receives the following arguments

- event name
- payload
- current

And returns a tuple whose last element is the new state. It can also return
one or many events to dispatch on the calling DOM Element:

```elixir
  def handle_event("add_todo_with_one_reply", todo, %{todos: todos}) do
    {:reply, %Event{name: "reply_event", detail: %{foo: "bar"}}, %{todos: [todo | todos]}}
  end

  def handle_event("add_todo_with_two_replies", todo, %{todos: todos}) do
    {:reply,
     [
       %Event{name: "reply_event1", detail: %{foo: "bar"}},
       %Event{name: "reply_event2", detail: %{bing: "baz"}}
     ], %{todos: [todo | todos]}}
  end
```

## Documentation

- [API Docs](https://hexdocs.pm/seance/) are available in the [hex package](https://hex.pm/packages/seance).

## Inspriation

This library was adapted from [live_state](https://github.com/launchscout/live_state)
