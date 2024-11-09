import React from "react";
import { snakeToCamelCase } from "@channeling/seance";

function App(): JSX.Element {
  return (
    <div>
      <h1>{snakeToCamelCase("boo_foo_bar")}</h1>
    </div>
  );
}

export default App;
