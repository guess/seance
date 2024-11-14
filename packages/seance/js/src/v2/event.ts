import { Socket } from "./socket";

export type Event = {
  type: string;
  payload: Record<string, unknown>;
};

export const handleEvent = (socket: Socket, event: Event): Socket => {
  const handler = socket.callbacks?.eventHandlers?.[event.type];
  if (!handler) {
    throw new Error(`No handler registered for event type: ${event.type}`);
  }
  return handler(event.payload, socket);
};
