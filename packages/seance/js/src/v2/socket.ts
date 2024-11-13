import {
  Socket as PhoenixSocket,
  Channel as PhoenixChannel,
  SocketOptions as PhoenixSocketOptions,
} from "phoenix";
import { StateData } from "./state";
import { Event } from "./event";

export type PartialSocket = {
  readonly _socket: PhoenixSocket;
  readonly endpoint: string;
  readonly assigns: Record<string, unknown>;
  readonly status: SocketStatus;
};

export type Socket = PartialSocket & {
  readonly _channel: PhoenixChannel;
  readonly topic: string;
  readonly joined: boolean;
  readonly callbacks?: ChannelCallbacks;
};

export type ChannelCallbacks = {
  onJoin?: (socket: Socket) => Socket;
  onLeave?: (socket: Socket) => Socket;
  onError?: (error: Error, socket: Socket) => Socket;
  onStateChange?: (state: StateData, socket: Socket) => Socket;
  onEvent?: (event: Event, socket: Socket) => Socket;
  onUpdate?: (socket: Socket) => Socket;
};

export type SocketStatus = "disconnected" | "connecting" | "connected";

export type SocketCallbacks = {
  onOpen?: (socket: PartialSocket) => void;
  onClose?: (socket: PartialSocket) => void;
  onError?: (error: Error, socket: PartialSocket) => void;
};

export type SocketOptions = {
  callbacks?: SocketCallbacks;
  assigns?: Record<string, unknown>;
  socketOptions?: PhoenixSocketOptions;
};

const updateStatus = (
  socket: PartialSocket,
  status: SocketStatus
): PartialSocket => ({
  ...socket,
  status,
});

export const createSocket = (
  endpoint: string,
  opts: SocketOptions = {}
): PartialSocket => {
  const { callbacks = {}, assigns = {}, socketOptions = {} } = opts;
  const socket = new PhoenixSocket(endpoint, socketOptions);

  let currentSocket: PartialSocket = {
    _socket: socket,
    endpoint: endpoint,
    assigns: assigns,
    status: "connecting",
  };

  socket.onOpen(() => {
    currentSocket = updateStatus(currentSocket, "connected");
    callbacks.onOpen?.(currentSocket);
  });

  socket.onClose(() => {
    currentSocket = updateStatus(currentSocket, "disconnected");
    callbacks.onClose?.(currentSocket);
  });

  socket.onError((error: unknown) => {
    callbacks.onError?.(
      error instanceof Error ? error : new Error(String(error)),
      currentSocket
    );
  });

  socket.connect();

  return currentSocket;
};

export const assign = <T extends PartialSocket>(
  socket: T,
  newAssigns: Record<string, unknown>
): T => ({
  ...socket,
  assigns: { ...socket.assigns, ...newAssigns },
});

export const disconnect = (socket: PartialSocket): PartialSocket => {
  socket._socket.disconnect();
  return updateStatus(socket, "disconnected");
};

// TODO: Will also need to have a wrapper for channel too
export const createChannel = (
  socket: Socket,
  topic: string,
  params?: object
): PhoenixChannel => {
  return socket._socket.channel(topic, params);
};
