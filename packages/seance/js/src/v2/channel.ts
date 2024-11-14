import { Event, handleEvent } from "./event";
import {
  assign,
  Assigns,
  ChannelCallbacks,
  PartialSocket,
  Socket,
} from "./socket";
import {
  applyChange,
  applyPatch,
  StateChange,
  StateData,
  StatePatch,
} from "./state";

/**
 * Options for configuring a channel connection.
 */
export type ChannelOptions<T extends Assigns> = {
  /** Event callbacks and handlers for the channel */
  callbacks?: ChannelCallbacks<T>;
  /** Parameters to send when joining the channel */
  params?: Record<string, unknown>;
};

/**
 * A Channel represents the primary interface for interacting with a Phoenix channel.
 * It provides methods for sending events both locally and to the server.
 */
export type Channel = {
  /**
   * Dispatches an event to be handled locally by registered event handlers.
   *
   * @param type - The type of event to dispatch
   * @param payload - Data associated with the event
   */
  dispatch: (type: string, payload: Record<string, unknown>) => void;

  /**
   * Pushes an event to the server over the Phoenix channel.
   *
   * @param type - The type of event to push
   * @param payload - Data to send with the event
   */
  push: (type: string, payload: Record<string, unknown>) => void;
};

/**
 * Attaches a Phoenix channel to a socket without joining it.
 *
 * @param socket - The socket to attach the channel to
 * @param topic - The channel topic to connect to
 * @param options - Configuration options for the channel
 * @returns A new Socket instance with the channel attached
 */
export const attach = <T extends Assigns>(
  socket: PartialSocket,
  topic: string,
  options: ChannelOptions<T> = {}
): Socket<T> => {
  const { params = {} } = options;
  const phoenixChannel = socket._socket.channel(topic, params);

  return {
    ...socket,
    _channel: phoenixChannel,
    assigns: socket.assigns as T,
    topic,
    joined: false,
    dispatch: () => {
      throw new Error("Channel not initialized. Call joinChannel first.");
    },
    push: () => {
      throw new Error("Channel not initialized. Call joinChannel first.");
    },
  };
};

/**
 * Joins a channel and sets up event handling.
 *
 * The join process:
 * 1. Connects to the Phoenix channel
 * 2. Sets up event handlers
 * 3. Returns a Channel interface for interacting with the connection
 *
 * @param socket - The socket with an attached channel to join
 * @returns A Channel interface for sending events
 * @throws Error if the channel is already joined
 */
export const join = <T extends Assigns>(initialSocket: Socket<T>): Channel => {
  if (initialSocket.joined) throw new Error("Channel already joined");

  let socket = { ...initialSocket };

  const actions = {
    dispatch: (type: string, payload: Record<string, unknown>) => {
      const event = { type, payload };
      callbacks.onEvent(event);
    },
    push: (type: string, payload: Record<string, unknown>) => {
      const event = { type, payload };
      socket._channel.push("seance:event", event);
    },
  };

  const callbacks = {
    onJoin: () => {
      socket = { ...socket, joined: true };
      callbacks.onUpdate(socket.callbacks?.join?.(socket));
    },
    onStateChange: (state: StateData) => {
      callbacks.onUpdate(assign(socket, { state }));
    },
    onEvent: (event: Event) => {
      callbacks.onUpdate(handleEvent(socket, event));
    },
    onError: (error: Error) => {
      callbacks.onUpdate(socket.callbacks?.error?.(error, socket));
    },
    onLeave: () => {
      socket = { ...socket, joined: false };
      callbacks.onUpdate(socket.callbacks?.leave?.(socket));
    },
    onUpdate: (newSocket?: Socket<T>) => {
      if (newSocket) {
        socket = socket.callbacks?.update?.(newSocket) ?? newSocket;
      }
    },
  };

  socket._channel.on("seance:change", (change: StateChange) => {
    const newState = applyChange(change);
    callbacks.onStateChange(newState);
  });

  socket._channel.on("seance:patch", (patch: StatePatch) => {
    const currentState = socket.assigns.state as StateData;
    if (!currentState) return;

    const newState = applyPatch(currentState, patch);
    if (newState) {
      callbacks.onStateChange(newState);
    }
  });

  socket._channel.on("seance:event", (event: Event) => {
    callbacks.onEvent(event);
  });

  socket._channel.on("seance:error", (event: unknown) => {
    // TODO: Figure out event type
    // logger.debug("TODO: server error", event);
    // event.error
    const error = new Error(String(event));
    callbacks.onError(error);
  });

  socket._channel.onClose(() => {
    callbacks.onLeave();
  });

  try {
    socket._channel
      .join()
      .receive("ok", () => {
        callbacks.onJoin();
      })
      .receive("error", (error) => {
        callbacks.onError(error);
      });

    return actions;
  } catch (error) {
    callbacks.onError(
      error instanceof Error ? error : new Error(String(error))
    );
    throw error;
  }
};

/**
 * Leaves a channel and cleans up event handlers.
 *
 * @param socket - The socket with the channel to leave
 */
export const leave = <T extends Assigns>(socket: Socket<T>): void => {
  if (!socket.joined) return;
  socket._channel.leave();
};
