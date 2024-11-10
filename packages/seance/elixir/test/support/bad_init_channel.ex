defmodule Seance.Test.BadInitChannel do
  @moduledoc false

  use Seance.Channel, web_module: Seance.Test.Web

  def init(_channel, _params, _socket) do
    {:error, "you stink"}
  end
end
