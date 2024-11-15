import { connect, create, disconnect } from "@qult/seance";
import React, { useEffect, useMemo } from "react";
// import { snakeToCamelCase } from "@qult/seance";

function App(): JSX.Element {
  const socket = useMemo(
    () =>
      create("ws://localhost:4000/seance", {
        socketOptions: { params: { token: "socket_token" } },
      }),
    []
  );

  useEffect(() => {
    connect(socket);

    return () => {
      disconnect(socket);
    };
  }, [socket]);

  return (
    <div>
      <div>Hello</div>
      <button>Click me</button>
    </div>
  );
}

export default App;
