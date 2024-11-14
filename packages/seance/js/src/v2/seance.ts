import { attach, join, leave } from "./channel";
import { assign, connect, create } from "./socket";

// usage

const socket = create("ws://localhost:4000/socket", {
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

connect(socket);

const channel = attach(socket, "room:lobby", {
  params: { token: "123" },
  callbacks: {
    join: (socket) => {
      // mount(topic, params, socket);
      return socket;
    },
    leave: (socket) => {
      return socket;
    },
    error: (_error, socket) => {
      return socket;
    },
    update: (socket) => {
      currentSocket = socket;
      return socket;
    },
    eventHandlers: {
      increment: (_params, socket) => {
        return socket;
      },
    },
  },
});

let currentSocket;
join(channel);

// currentSocket!.push("increment", { amount: 1 });

leave(channel);
