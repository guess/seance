defmodule Seance.MessageBuilder do
  @moduledoc """
  This is the default message builder for Seance. It will send [json_patch](https://datatracker.ietf.org/doc/html/rfc6902)
  messages for state updates. The Elixir terms are compared using the `JSONDiff` library to create the
  JSON patch. Because JSONDiff is not aware of any impls of the JSON Encoder protocol, the patch
  may or may not match the JSON encoding in certain cases. Best effort has been made to handle common
  cases such ecto schemas and DateTime. To gain further control over this process, you
  may implement the `Seance.Encoder` protocol which will allow you to define a pre-diff representation.

  For a slower, but potentially more correct approach to the problem, there is a [branch](https://github.com/launchscout/live_state/tree/rust-json-diff) containing
  an alternate json diff implemenation in rust.
  """
  alias Seance.Encoder

  def update_state_message(old_state, new_state, version, opts \\ []) do
    old_state_encoded = Encoder.encode(old_state, opts)
    new_state_encoded = Encoder.encode(new_state, opts)

    {"seance:patch",
     %{
       operations: Jsonpatch.diff(old_state_encoded, new_state_encoded),
       version: version
     }}
  end

  def new_state_message(new_state, version, opts \\ []) do
    {"seance:change", %{state: Encoder.encode(new_state, opts), version: version}}
  end
end
