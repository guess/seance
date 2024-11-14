import { Event, handleEvent } from "./event";
import { assign, ChannelCallbacks, PartialSocket, Socket } from "./socket";
import {
  applyChange,
  applyPatch,
  StateChange,
  StateData,
  StatePatch,
} from "./state";

/**
 * Options for configuring a channel.
 */
export type ChannelOptions = {
  /** Channel event callbacks */
  callbacks?: ChannelCallbacks;
  /** Parameters to send when joining the channel */
  params?: Record<string, unknown>;
};

/**
 * Attaches a Phoenix channel to a socket.
 * Creates a new Socket instance with the channel attached but not yet joined.
 *
 * @param socket The partial socket to attach the channel to
 * @param topic The channel topic to connect to
 * @param options Channel configuration options
 * @returns A new Socket instance with the channel attached
 */
export const attach = (
  socket: PartialSocket,
  topic: string,
  options: ChannelOptions = {}
): Socket => {
  const { params = {} } = options;
  const phoenixChannel = socket._socket.channel(topic, params);

  return {
    ...socket,
    _channel: phoenixChannel,
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
 * Joins a channel and sets up event handlers.
 * Manages channel state through callbacks and maintains socket state internally.
 *
 * Callbacks are processed in the following order:
 * 1. Internal state updates
 * 2. User-provided callback (onJoin, onLeave, etc.)
 * 3. onUpdate callback with the latest socket state
 *
 * Does nothing if the channel is already joined.
 *
 * @param socket The socket with the channel to join
 */
export const join = (initialSocket: Socket): void => {
  if (initialSocket.joined) return;

  const { _channel } = initialSocket;

  const dispatch = (type: string, payload: Record<string, unknown>) => {
    const event = { type, payload };
    callbacks.onEvent(event);
  };

  const push = (type: string, payload: Record<string, unknown>) => {
    const event = { type, payload };
    socket._channel.push("seance:event", event);
  };

  let socket = { ...initialSocket, dispatch, push };

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
    onUpdate: (newSocket?: Socket) => {
      if (newSocket) {
        socket = socket.callbacks?.update?.(newSocket) ?? newSocket;
      }
    },
  };

  _channel.on("seance:change", (change: StateChange) => {
    const newState = applyChange(change);
    callbacks.onStateChange(newState);
  });

  _channel.on("seance:patch", (patch: StatePatch) => {
    const currentState = socket.assigns.state as StateData;
    if (!currentState) return;

    const newState = applyPatch(currentState, patch);
    if (newState) {
      callbacks.onStateChange(newState);
    }
  });

  _channel.on("seance:event", (event: Event) => {
    callbacks.onEvent(event);
  });

  _channel.on("seance:error", (event: unknown) => {
    // TODO: Figure out event type
    // logger.debug("TODO: server error", event);
    const error = new Error(String(event.error));
    callbacks.onError(error);
  });

  _channel.onClose(() => {
    callbacks.onLeave();
  });

  try {
    _channel
      .join()
      .receive("ok", () => {
        callbacks.onJoin();
      })
      .receive("error", (error) => {
        callbacks.onError(error);
      });
  } catch (error) {
    callbacks.onError(
      error instanceof Error ? error : new Error(String(error))
    );
    throw error;
  }
};

/**
 * Leaves a channel if it's currently joined.
 * The channel's onClose callback will handle the state updates.
 *
 * Does nothing if the channel is not joined.
 *
 * @param socket The socket with the channel to leave
 */
export const leave = (socket: Socket): void => {
  if (!socket.joined) return;
  socket._channel.leave();
};
