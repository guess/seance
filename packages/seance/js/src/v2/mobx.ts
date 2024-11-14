// Impl

import { makeAutoObservable, computed, autorun } from "mobx";
import {
  Socket,
  PartialSocket,
  Assigns,
  assign,
  create,
  connect,
} from "./socket";
import {
  attach,
  join as joinChannel,
  leave as leaveChannel,
  Channel,
} from "./channel";

type EventHandler<T extends Assigns> = (
  params: any,
  socket: Socket<T>
) => Socket<T>;
type LifecycleHandler<T extends Assigns> = (socket: Socket<T>) => Socket<T>;

type ChannelActions<T extends Assigns> = {
  dispatch: Channel["dispatch"];
  push: Channel["push"];
  handleEvent: (type: string, handler: EventHandler<T>) => void;
  mount: (handler: LifecycleHandler<T>) => void;
  terminate: (handler: LifecycleHandler<T>) => void;
  error: (handler: (error: Error, socket: Socket<T>) => Socket<T>) => void;
};

type ChannelBuilder<
  T extends Assigns,
  A = Record<string, (...args: any[]) => void>,
> = (actions: ChannelActions<T>) => A;

// Define base class with core functionality
class MobXChannelBase<T extends Assigns> {
  protected _socket: Socket<T>;
  protected _channel: Channel | null = null;
  protected _eventHandlers: Record<string, EventHandler<T>> = {};
  protected _mountHandler?: LifecycleHandler<T>;
  protected _terminateHandler?: LifecycleHandler<T>;
  protected _errorHandler?: (error: Error, socket: Socket<T>) => Socket<T>;

  constructor(
    socket: PartialSocket,
    topic: string,
    params: Record<string, unknown>
  ) {
    this._socket = attach(socket, topic, { params });
    makeAutoObservable(this, {
      assigns: computed,
    });
  }

  get assigns(): T {
    return this._socket.assigns;
  }

  join(): void {
    if (this._channel) {
      throw new Error("Channel already joined");
    }

    this._socket = {
      ...this._socket,
      callbacks: {
        join: (socket) => {
          const newSocket = this._mountHandler?.(socket) ?? socket;
          return newSocket;
        },
        leave: (socket) => {
          const newSocket = this._terminateHandler?.(socket) ?? socket;
          return newSocket;
        },
        error: (error, socket) => {
          const newSocket = this._errorHandler?.(error, socket) ?? socket;
          return newSocket;
        },
        update: (socket) => {
          this._socket = socket;
          return socket;
        },
        eventHandlers: this._eventHandlers,
      },
    };

    this._channel = joinChannel(this._socket);
  }

  leave(): void {
    if (!this._channel) {
      return;
    }
    leaveChannel(this._socket);
    this._channel = null;
  }
}

// Factory function to create channel with actions
export function createChannel<
  T extends Assigns,
  A extends Record<string, (...args: any[]) => void>,
>(
  socket: PartialSocket,
  topic: string,
  params: Record<string, unknown>,
  builder: ChannelBuilder<T, A>
): MobXChannelBase<T> & A {
  class MobXChannel extends MobXChannelBase<T> {
    constructor() {
      super(socket, topic, params);

      const actions: ChannelActions<T> = {
        dispatch: (type: string, payload: Record<string, unknown>) => {
          this._channel?.dispatch(type, payload);
        },
        push: (type: string, payload: Record<string, unknown>) => {
          this._channel?.push(type, payload);
        },
        handleEvent: (type: string, handler: EventHandler<T>) => {
          this._eventHandlers[type] = handler;
        },
        mount: (handler: LifecycleHandler<T>) => {
          this._mountHandler = handler;
        },
        terminate: (handler: LifecycleHandler<T>) => {
          this._terminateHandler = handler;
        },
        error: (handler: (error: Error, socket: Socket<T>) => Socket<T>) => {
          this._errorHandler = handler;
        },
      };

      const channelActions = builder(actions);
      Object.assign(this, channelActions);
    }
  }

  return new MobXChannel() as MobXChannelBase<T> & A;
}

// Usage:
type ChatState = {
  messages: string[];
};

type ChatActions = {
  sendMessage: (message: string) => void;
  sendLocalMessage: (message: string) => void;
};

const socket = create("ws://localhost:4000/socket", {
  socketOptions: { params: { token: "123" } },
});
connect(socket);

const channel = createChannel<ChatState, ChatActions>(
  socket,
  "room:lobby",
  { token: "123" },
  ({ dispatch, push, handleEvent, mount, terminate, error }) => {
    mount((socket) => {
      return assign(socket, { connected: true });
    });

    terminate((socket) => {
      return socket;
    });

    error((err, socket) => {
      console.error(err);
      return socket;
    });

    // Receive event from server OR locally
    handleEvent("recv_message", (params, socket) => {
      return assign(socket, {
        messages: [...socket.assigns.messages, params.message],
      });
    });

    return {
      sendMessage: (message: string) => {
        // Send event to server
        push("send_message", { message });
      },
      sendLocalMessage: (message: string) => {
        // Dispatch events locally
        dispatch("recv_message", { message });
      },
    };
  }
);

// Now this should work with proper typing
channel.join();

// Send message to server
channel.sendMessage("Hello");

// Send message locally
channel.sendLocalMessage("Hello");

// Automatically update assigns from server
autorun(() => console.log(channel.assigns.messages));

channel.leave();
