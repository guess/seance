import { attachChannel, joinChannel } from "./channel";
import { assign, connectSocket, initializeSocket } from "./socket";
import { SocketOptions } from "phoenix";

// usage

const socket = initializeSocket("ws://localhost:4000/socket", {
  socketOptions: {
    params: { token: "123" },
  },
  callbacks: {
    onOpen: (socket) => {
      return assign(socket, { user: "steve" });
    },
    onClose: (socket) => {
      return socket;
    },
    onError: (_error, socket) => {
      return socket;
    },
    onUpdate: (socket) => {
      return socket;
    },
  },
});

connectSocket(socket);

const channel = attachChannel(socket, "room:lobby", {
  params: { token: "123" },
  callbacks: {
    onJoin: (socket) => {
      // mount(topic, params, socket);
      return socket;
    },
    onLeave: (socket) => {
      // unmount(socket);
      return socket;
    },
    onError: (error, socket) => {
      // error(error, socket);
      return socket;
    },
    onUpdate: (socket) => {
      // update(socket)
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
joinChannel(channel);

// currentSocket!.push("increment", { amount: 1 });
