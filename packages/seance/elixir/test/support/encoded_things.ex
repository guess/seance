defmodule Seance.Test.Thing do
  @moduledoc false
  defstruct [:foo, :bar]
end

defimpl Seance.Encoder, for: Seance.Test.Thing do
  @moduledoc false
  def encode(%Seance.Test.Thing{foo: foo}, []) do
    %{foo: foo}
  end
end

defmodule Seance.Test.OtherThing do
  @moduledoc false
  @derive [{Seance.Encoder, except: [:wuzzle, :__meta__]}]

  defstruct [:bing, :baz, :wuzzle, :__meta__]
end

defmodule Seance.Test.OnlyThing do
  @moduledoc false
  @derive [{Seance.Encoder, only: [:baz, :wuzzle]}]

  defstruct [:bing, :baz, :wuzzle]
end

defmodule Seance.Test.FakeSchema do
  @moduledoc false
  use Ecto.Schema

  schema "fake_table" do
    field(:foo, :string)
    field(:name, :string)
    field(:birth_date, :utc_datetime)
    timestamps()
  end
end
