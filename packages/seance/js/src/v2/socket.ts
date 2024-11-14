import {
  Socket as PhoenixSocket,
  Channel as PhoenixChannel,
  SocketOptions as PhoenixSocketOptions,
} from "phoenix";

export type Assigns = Record<string, unknown>;

/**
 * Represents a partial socket connection without an attached channel.
 */
export type PartialSocket = {
  readonly _socket: PhoenixSocket;
  readonly _socketCallbacks?: SocketCallbacks;
  readonly endpoint: string;
  readonly assigns: Assigns;
  readonly status: SocketStatus;
};

/**
 * Represents a complete socket with an attached channel.
 */
export type Socket<T extends Assigns> = PartialSocket & {
  readonly _channel: PhoenixChannel;
  readonly assigns: T;
  readonly topic: string;
  readonly joined: boolean;
  readonly callbacks?: ChannelCallbacks<T>;
  readonly dispatch: (type: string, payload: Record<string, unknown>) => void;
  readonly push: (type: string, payload: Record<string, unknown>) => void;
};

/**
 * Event handler function type.
 * Receives event payload and current socket state, returns new socket state.
 */
export type EventHandler<T extends Assigns> = (
  params: Record<string, unknown>,
  socket: Socket<T>
) => Socket<T>;

/** Map of event types to their handlers */
export type EventHandlers<T extends Assigns> = Record<string, EventHandler<T>>;

/**
 * Callbacks for channel lifecycle events.
 * All callbacks receive the current socket state and return new state.
 */
export type ChannelCallbacks<T extends Assigns> = {
  /** Called when the channel successfully joins */
  join?: (socket: Socket<T>) => Socket<T>;
  /** Called when the channel leaves or disconnects */
  leave?: (socket: Socket<T>) => Socket<T>;
  /** Called when a channel error occurs */
  error?: (error: Error, socket: Socket<T>) => Socket<T>;
  /** Called after any socket update */
  update?: (socket: Socket<T>) => Socket<T>;
  /** Called when a custom event is received */
  eventHandlers?: EventHandlers<T>;
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
  connect?: (socket: PartialSocket) => PartialSocket;
  /** Called when the socket connection is closed */
  disconnect?: (socket: PartialSocket) => PartialSocket;
  /** Called when a socket error occurs */
  error?: (error: Error, socket: PartialSocket) => PartialSocket;
  /** Called after any socket update */
  update?: (socket: PartialSocket) => PartialSocket;
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
 * Creates a new socket connection.
 *
 * @param endpoint - WebSocket endpoint URL
 * @param opts - Configuration options
 * @returns A new socket instance
 */
export const create = (
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

/**
 * Connects a socket to its endpoint and sets up lifecycle handlers.
 *
 * @param socket - The socket to connect
 */
export const connect = (socket: PartialSocket): void => {
  let currentSocket = socket;

  const callbacks = {
    onOpen: () => {
      currentSocket = updateStatus(currentSocket, "connected");
      callbacks.onUpdate(socket._socketCallbacks?.connect?.(currentSocket));
    },
    onClose: () => {
      currentSocket = updateStatus(currentSocket, "disconnected");
      callbacks.onUpdate(socket._socketCallbacks?.disconnect?.(currentSocket));
    },
    onError: (error: Error) => {
      callbacks.onUpdate(
        socket._socketCallbacks?.error?.(error, currentSocket)
      );
    },
    onUpdate: (newSocket?: PartialSocket) => {
      if (newSocket) {
        currentSocket =
          socket._socketCallbacks?.update?.(newSocket) ?? newSocket;
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
