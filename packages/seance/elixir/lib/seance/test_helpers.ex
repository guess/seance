defmodule Seance.TestHelpers do
  require Phoenix.ChannelTest
  import Phoenix.ChannelTest

  @doc """
  Pushes a live state event over the channel
  """
  def send_event(socket, event, payload) do
    push(socket, "seance:event:" <> event, payload)
  end

  @doc """
  Asserts that `seance:change` message is received over a channel matching the specified pattern
  """
  defmacro assert_state_change(state) do
    quote do
      assert_push("seance:change", %{state: unquote(state)})
    end
  end

  @doc """
  Asserts that `seance:patch` message is received over a channel matching the specified pattern
  """
  defmacro assert_state_patch(patch) do
    quote do
      assert_push("seance:patch", %{operations: unquote(patch)})
    end
  end
end
