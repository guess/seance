import { Assigns, Socket } from "./socket";

/**
 * Represents an event in the system.
 */
export type Event = {
  /** The type of event */
  type: string;
  /** Data associated with the event */
  payload: Record<string, unknown>;
};

/**
 * Handles an event using registered event handlers.
 *
 * @param socket - The socket containing event handlers
 * @param event - The event to handle
 * @returns A new socket state after handling the event
 * @throws Error if no handler is registered for the event type
 */
export const handleEvent = <T extends Assigns>(
  socket: Socket<T>,
  event: Event
): Socket<T> => {
  const handler = socket.callbacks?.eventHandlers?.[event.type];
  if (!handler) {
    throw new Error(`No handler registered for event type: ${event.type}`);
  }
  return handler(event.payload, socket);
};
