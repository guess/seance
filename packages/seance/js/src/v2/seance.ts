import { attach, join, leave } from "./channel";
import { assign, connect, create, disconnect } from "./socket";

// Usage example

// Create a socket connection
const conn = create("ws://localhost:4000/socket", {
  socketOptions: {
    params: { token: "123" },
  },
  callbacks: {
    connect: (socket) => {
      return assign(socket, { user: "steve" });
    },
    disconnect: (socket) => {
      return socket;
    },
    error: (_error, socket) => {
      return socket;
    },
    update: (socket) => {
      return socket;
    },
  },
});

connect(conn);

// Connect to a channel
let socket = attach(conn, "room:lobby", {
  params: { token: "123" },
  callbacks: {
    join: (socket) => {
      return socket;
    },
    leave: (socket) => {
      return socket;
    },
    error: (_error, socket) => {
      return socket;
    },
    update: (newSocket) => {
      socket = newSocket;
      return socket;
    },
    eventHandlers: {
      increment: (_params, socket) => {
        return socket;
      },
    },
  },
});

// Get interface for interacting with the channel
const channel = join(socket);

// Send events
channel.push("increment", { amount: 1 });
channel.dispatch("increment", { amount: 1 });

// Clean up
leave(socket);
disconnect(socket);
