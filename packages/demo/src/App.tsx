import React from "react";
import { greet, Calculator } from "@channeling/seance";

function App(): JSX.Element {
  const calc = new Calculator();

  return (
    <div>
      <h1>{greet("Developer")}</h1>
      <p>2 + 2 = {calc.add(2, 2)}</p>
    </div>
  );
}

export default App;
