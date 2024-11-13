import {
  Socket as PhoenixSocket,
  Channel as PhoenixChannel,
  SocketOptions as PhoenixSocketOptions,
} from "phoenix";

export type Socket = {
  readonly _socket: PhoenixSocket;
  readonly assigns: Record<string, unknown>;
  readonly status: SocketStatus;
};

export type SocketStatus = "disconnected" | "connecting" | "connected";

export type SocketCallbacks = {
  onOpen?: (socket: Socket) => void;
  onClose?: (socket: Socket) => void;
  onError?: (error: Error, socket: Socket) => void;
};

export type SocketOptions = {
  callbacks?: SocketCallbacks;
  assigns?: Record<string, unknown>;
  socketOptions?: PhoenixSocketOptions;
};

const updateStatus = (socket: Socket, status: SocketStatus): Socket => ({
  ...socket,
  status,
});

export const createSocket = (
  endpoint: string,
  opts: SocketOptions = {}
): Socket => {
  const { callbacks = {}, assigns = {}, socketOptions = {} } = opts;
  const socket = new PhoenixSocket(endpoint, socketOptions);

  let currentSocket: Socket = {
    _socket: socket,
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

export const assign = (
  socket: Socket,
  newAssigns: Record<string, unknown>
): Socket => ({
  ...socket,
  assigns: { ...socket.assigns, ...newAssigns },
});

export const disconnect = (socket: Socket): Socket => {
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
