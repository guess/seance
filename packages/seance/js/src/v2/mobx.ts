import { assign, Assigns, PartialSocket, Socket } from "./socket";
import { makeAutoObservable } from "mobx";

type Params = Record<string, unknown>;

interface ChannelCallbacks<T extends Assigns> {
  join?: (topic: string, params: Params, socket: Socket<T>) => Socket<T>;
  leave?: (socket: Socket<T>) => Socket<T>;
  handleError?: (error: Error, socket: Socket<T>) => Socket<T>;
}

@channel("room:{id}")
export class Seance<T extends Assigns> {
  socket: PartialSocket | null = null;

  // constructor() {
  //   makeAutoObservable(this);
  // }

  join = (_topic: string, _params: Params, socket: Socket<T>) => {
    return socket;
  };

  leave = (socket: Socket<T>) => {
    return socket;
  };

  handleError = (error: Error, socket: Socket<T>) => {
    return socket;
  };

  get assigns(): Params {
    return this.socket?.assigns ?? {};
  }

  get navigate(): string | undefined {
    return this.assigns.navigate;
  }

  notify = (msg: string) => {
    this.pushEvent("notify", { message: msg });
  };

  updateName = (name: string) => {
    this.pushEvent("update_name", { name });
  };

  @event("navigate")
  handleNavigate = ({ url }: Params, socket: Socket<T>): Socket<T> => {
    return assign(socket, { navigate: url });
  };

  @event("navigate_back")
  handleNavigateBack = (_params: Params, socket: Socket<T>) => {
    return socket;
  };
}
