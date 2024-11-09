defmodule Seance.Test.SocketyChannel do
  @moduledoc false

  use Seance.Channel, web_module: Seance.Test.Web

  @impl true
  def init(_channel, _payload, socket) do
    {:ok, %{foo: "bar"}, socket |> assign(:baz, "bing")}
  end

  @impl true
  def handle_event(
        "something_sockety",
        %{"baz" => new_baz},
        %{foo: foo},
        %{assigns: %{baz: _baz}} = socket
      ) do
    {:noreply, %{foo: "altered #{foo}"}, socket |> assign(:baz, new_baz)}
  end
end
