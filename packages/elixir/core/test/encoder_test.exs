defmodule Seance.EncoderTest do
  use ExUnit.Case

  alias Seance.Test.Thing
  alias Seance.Test.FakeSchema

  test "encode" do
    assert Seance.Encoder.encode(%{foo: "bar"}) == %{foo: "bar"}
  end

  test "encode with struct" do
    assert Seance.Encoder.encode(%Thing{foo: "bar", bar: "baz"}) == %{foo: "bar"}
  end

  test "encode date" do
    today = Date.utc_today()
    assert Seance.Encoder.encode(today) == Date.to_iso8601(today)
  end

  test "encode time" do
    time = ~T[12:00:00]
    assert Seance.Encoder.encode(time) == Time.to_iso8601(time)
  end

  test "encode naive datetime" do
    naive_datetime = ~N[2024-03-16 17:02:19]

    assert Seance.Encoder.encode(naive_datetime) ==
             NaiveDateTime.to_iso8601(naive_datetime)
  end

  test "encode fake schema" do
    now = DateTime.utc_now()
    iso_date = DateTime.to_iso8601(now)

    assert %{
             foo: "bar",
             inserted_at: ^iso_date
           } =
             Seance.Encoder.encode(%FakeSchema{foo: "bar", inserted_at: now},
               ignore_keys: [:__meta__]
             )
  end

  test "encode without keys" do
    assert Seance.Encoder.encode(%{foo: "wut", __meta__: "blah"}, ignore_keys: [:__meta__]) ==
             %{foo: "wut"}
  end

  test "encode a list" do
    assert Seance.Encoder.encode([%{foo: "bar"}, %Thing{foo: "baz", bar: "bing"}]) == [
             %{foo: "bar"},
             %{foo: "baz"}
           ]
  end

  test "encode a map" do
    assert Seance.Encoder.encode(%{foo: %{thing: %Thing{foo: "baz", bar: "bing"}}}) == %{
             foo: %{thing: %{foo: "baz"}}
           }
  end

  test "derive" do
    assert Seance.Encoder.encode(%Seance.Test.OtherThing{
             bing: "baz",
             baz: "bing",
             wuzzle: "wuzzle"
           }) == %{bing: "baz", baz: "bing"}

    assert Seance.Encoder.encode(%Seance.Test.OnlyThing{
             bing: "baz",
             baz: "bing",
             wuzzle: "wuzzle"
           }) == %{wuzzle: "wuzzle", baz: "bing"}
  end
end
