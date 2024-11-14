import {
  Socket as PhoenixSocket,
  Channel as PhoenixChannel,
  SocketOptions as PhoenixSocketOptions,
} from "phoenix";
import { StateData } from "./state";
import { Event } from "./event";

/**
 * Represents a partial socket connection without an attached channel.
 */
export type PartialSocket = {
  readonly _socket: PhoenixSocket;
  readonly _socketCallbacks?: SocketCallbacks;
  readonly endpoint: string;
  readonly assigns: Record<string, unknown>;
  readonly status: SocketStatus;
};

/**
 * Represents a complete socket with an attached channel.
 */
export type Socket = PartialSocket & {
  readonly _channel: PhoenixChannel;
  readonly topic: string;
  readonly joined: boolean;
  readonly callbacks?: ChannelCallbacks;
  readonly dispatch: (type: string, payload: Record<string, unknown>) => void;
  readonly push: (type: string, payload: Record<string, unknown>) => void;
};

export type EventHandlers = Record<string, EventHandler>;
export type EventHandler = (
  params: Record<string, unknown>,
  socket: Socket
) => Socket;

/**
 * Callbacks for channel events. All callbacks receive the current socket state
 * and should return the new socket state.
 */
export type ChannelCallbacks = {
  /** Called when the channel successfully joins */
  onJoin?: (socket: Socket) => Socket;
  /** Called when the channel leaves or disconnects */
  onLeave?: (socket: Socket) => Socket;
  /** Called when a channel error occurs */
  onError?: (error: Error, socket: Socket) => Socket;
  /** Called after any socket update */
  onUpdate?: (socket: Socket) => Socket;
  /** Called when a custom event is received */
  eventHandlers?: EventHandlers;
};

/**
 * Possible states of a socket connection.
 */
export type SocketStatus = "disconnected" | "connecting" | "connected";

/**
 * Callbacks for socket events. All callbacks receive the current socket state
 * and should return the new socket state.
 */
export type SocketCallbacks = {
  /** Called when the socket connection is established */
  onOpen?: (socket: PartialSocket) => PartialSocket;
  /** Called when the socket connection is closed */
  onClose?: (socket: PartialSocket) => PartialSocket;
  /** Called when a socket error occurs */
  onError?: (error: Error, socket: PartialSocket) => PartialSocket;
  /** Called after any socket update */
  onUpdate?: (socket: PartialSocket) => PartialSocket;
};

/**
 * Options for initializing a socket connection.
 */
export type SocketOptions = {
  /** Socket event callbacks */
  callbacks?: SocketCallbacks;
  /** Initial assigns for the socket */
  assigns?: Record<string, unknown>;
  /** Phoenix socket options */
  socketOptions?: PhoenixSocketOptions;
};

/**
 * Initializes a new socket connection with the given endpoint.
 * The socket state is managed through callbacks.
 *
 * @param endpoint The WebSocket endpoint to connect to
 * @param opts Socket configuration options
 */
export const initializeSocket = (
  endpoint: string,
  opts: SocketOptions = {}
): PartialSocket => {
  const { assigns = {}, socketOptions = {}, callbacks = {} } = opts;
  const socket = new PhoenixSocket(endpoint, socketOptions);

  return {
    _socket: socket,
    _socketCallbacks: callbacks,
    endpoint: endpoint,
    assigns: assigns,
    status: "connecting",
  };
};

export const connectSocket = (socket: PartialSocket): void => {
  let currentSocket = socket;

  const callbacks = {
    onOpen: () => {
      currentSocket = updateStatus(currentSocket, "connected");
      callbacks.onUpdate(socket._socketCallbacks?.onOpen?.(currentSocket));
    },
    onClose: () => {
      currentSocket = updateStatus(currentSocket, "disconnected");
      callbacks.onUpdate(socket._socketCallbacks?.onClose?.(currentSocket));
    },
    onError: (error: Error) => {
      callbacks.onUpdate(
        socket._socketCallbacks?.onError?.(error, currentSocket)
      );
    },
    onUpdate: (newSocket?: PartialSocket) => {
      if (newSocket) {
        currentSocket =
          socket._socketCallbacks?.onUpdate?.(newSocket) ?? newSocket;
      }
    },
  };

  socket._socket.onOpen(() => {
    callbacks.onOpen();
  });

  socket._socket.onClose(() => {
    callbacks.onClose();
  });

  socket._socket.onError((error: unknown) => {
    callbacks.onError(
      error instanceof Error ? error : new Error(String(error))
    );
  });

  socket._socket.connect();
};

/**
 * Checks if a socket is currently connected.
 *
 * @param socket The socket to check
 * @returns True if the socket status is "connected"
 */
export const isConnected = (socket: PartialSocket): boolean =>
  socket.status === "connected";

/**
 * Checks if a socket is ready for channel operations.
 * Verifies both the socket status and the underlying Phoenix socket connection.
 *
 * @param socket The socket to check
 * @returns True if the socket is fully ready for operations
 */
export const isReady = (socket: PartialSocket): boolean =>
  isConnected(socket) && socket._socket.isConnected();

/**
 * Assigns new values to the socket's assigns object.
 * Returns a new socket instance with the updated assigns.
 *
 * @param socket The socket to update
 * @param newAssigns The new values to assign
 * @returns A new socket instance with updated assigns
 */
export const assign = <T extends PartialSocket>(
  socket: T,
  newAssigns: Record<string, unknown>
): T => ({
  ...socket,
  assigns: { ...socket.assigns, ...newAssigns },
});

/**
 * Disconnects a socket connection.
 * Returns a new socket instance with updated status.
 *
 * @param socket The socket to disconnect
 * @returns A new socket instance with "disconnected" status
 */
export const disconnect = (socket: PartialSocket): PartialSocket => {
  socket._socket.disconnect();
  return updateStatus(socket, "disconnected");
};

const updateStatus = (
  socket: PartialSocket,
  status: SocketStatus
): PartialSocket => ({
  ...socket,
  status,
});
