import { Socket as PhoenixSocket } from "phoenix";
import { Channel as PhoenixChannel } from "phoenix";
import { PhoenixSocketErrorEvent } from "./phoenix.js";
import { Subject } from "rxjs";
import { LiveEvent, LiveEventStream } from "./events.js";
import { logger } from "./utils/logger.js";

export enum LiveSocketStatus {
  disconnected = "disconnected",
  connecting = "connecting",
  connected = "connected",
}

export class LiveSocket {
  private socket: PhoenixSocket;
  private subject = new Subject<LiveEvent>();
  private status: LiveSocketStatus = LiveSocketStatus.disconnected;

  constructor(
    public url: string,
    private stream: LiveEventStream,
    options?: object
  ) {
    this.socket = new PhoenixSocket(url, options);
  }

  connect(): void {
    if (this.status === LiveSocketStatus.disconnected) {
      this.setStatus(LiveSocketStatus.connecting);
      this.socket.onError((event?: PhoenixSocketErrorEvent) =>
        this.stream.pushError("socket", "socket", event?.error)
      );
      this.socket.onOpen(() => {
        this.setStatus(LiveSocketStatus.connected);
      });
      this.socket.onClose(() => {
        this.setStatus(LiveSocketStatus.disconnected);
      });
      this.socket.connect();
    } else {
      logger.warn("socket already connected");
    }
  }

  disconnect(): void {
    if (this.status === LiveSocketStatus.connected) {
      this.socket.disconnect();
    } else {
      logger.warn("socket not connected");
    }
  }

  channel(topic: string, params?: object): PhoenixChannel {
    return this.socket.channel(topic, params);
  }

  private setStatus(status: LiveSocketStatus): void {
    this.status = status;
    this.stream.push("socket", "connect", { status: this.status });
  }
}
