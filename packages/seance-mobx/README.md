# @channeling/seance-mobx

MobX bindings for Seance: seamlessly sync Phoenix Channel state with MobX observables.

## Installation

```bash
npm install @channeling/seance-mobx seance mobx
```

## Usage

Create a typed channel with automatic state synchronization:

```typescript
type ChatState = {
  messages: string[];
  connected: boolean;
};

type ChatActions = {
  sendMessage: (message: string) => void;
  sendLocalMessage: (message: string) => void;
};

// Create and connect socket
const socket = create("ws://localhost:4000/socket", {
  socketOptions: { params: { token: "123" } },
});
connect(socket);

// Create channel with typed state and actions
const channel = createChannel<ChatState, ChatActions>(
  socket,
  "room:lobby",
  { token: "123" },
  ({ dispatch, push, handleEvent, mount }) => {
    // Handle connection
    mount((socket) => {
      return assign(socket, { connected: true });
    });

    // Handle incoming messages
    handleEvent("recv_message", (params, socket) => {
      return assign(socket, {
        messages: [...socket.assigns.messages, params.message],
      });
    });

    // Define channel actions
    return {
      sendMessage: (message: string) => {
        push("send_message", { message });
      },
      sendLocalMessage: (message: string) => {
        dispatch("recv_message", { message });
      },
    };
  }
);

// Connect to channel
channel.join();

// Send messages
channel.sendMessage("Hello server!");
channel.sendLocalMessage("Hello locally!");

// React to state changes with MobX
autorun(() => console.log(channel.assigns.messages));

// Disconnect
channel.leave();
```

## Features

- 🔄 Automatic state synchronization with Phoenix Channels
- 📦 MobX observable state management
- 💪 Full TypeScript support
- 🛠️ Flexible event handling and lifecycle hooks
- 🔍 Local event dispatch for testing and offline development

## API

`createChannel<State, Actions>(socket, topic, params, builder)`

Creates a new channel with typed state and actions.

**Parameters:**:

- `socket`: Phoenix socket connection
- `topic`: Channel topic string
- `params`: Connection parameters
  ` `builder`: Function to define channel behavior and actions

**Builder Actions:**

- `dispatch`: Trigger local events
- `push`: Send events to server
- `handleEvent`: Register event handlers
- `mount`: Handle channel join
- `terminate`: Handle channel leave
- `error`: Handle errors

## License

MIT
