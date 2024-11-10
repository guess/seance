import {
  PhoenixChannelError,
  PhoenixSocketError,
  PhoenixSocketErrorEvent,
} from "./phoenix.js";
import { Channel as PhoenixChannel } from "phoenix";
import { LiveSocket } from "./socket.js";
import { LiveErrorType, LiveEventStream, LiveEventType } from "./events.js";
import { LiveStateChange, LiveStatePatch } from "./state.js";
import { logger } from "./utils/logger.js";

export enum LiveChannelStatus {
  disconnected = "disconnected",
  connecting = "connecting",
  connected = "connected",
}

export type LiveChannelParams = {
  topic: string;
  params?: object;
};

export type LiveChannelEvent = {
  name: string;
  detail?: object;
};

export type LiveChannelConnectEvent = {
  status: LiveChannelStatus;
};

export class LiveChannel {
  private channel: PhoenixChannel;
  private status: LiveChannelStatus = LiveChannelStatus.disconnected;

  constructor(
    private socket: LiveSocket,
    private stream: LiveEventStream,
    params: LiveChannelParams
  ) {
    this.channel = socket.channel(params.topic, params.params);
  }

  /** connect to socket and join channel. will do nothing if already connected */
  join(): void {
    if (this.status === LiveChannelStatus.disconnected) {
      this.setStatus(LiveChannelStatus.connecting);
      this.channel.onError((event?: PhoenixSocketErrorEvent) => {
        // logger.log('channel error', event);
        this.emitError("channel", event?.error);
      });
      this.channel
        .join()
        .receive("ok", () => {
          this.setStatus(LiveChannelStatus.connected);
        })
        .receive("error", (error: PhoenixChannelError) => {
          this.emitError("channel", error);
        });
      this.channel.on("seance:event", (event: LiveChannelEvent) => {
        this.emitEvent("event", event);
      });
      this.channel.on("seance:change", (state: LiveStateChange) => {
        this.emitEvent("change", state);
      });
      this.channel.on("seance:patch", (patch: LiveStatePatch) => {
        this.emitEvent("patch", patch);
      });
      this.channel.on("seance:error", (event: PhoenixSocketErrorEvent) => {
        logger.debug("TODO: server error", event);
        this.emitError("server", event.error);
      });
      this.channel.onClose(() => {
        this.setStatus(LiveChannelStatus.disconnected);
      });
    }
  }

  /** leave channel and disconnect from socket */
  leave(): void {
    this.channel?.leave();
  }

  get topic(): string {
    return this.channel.topic;
  }

  pushEvent(eventName: string, payload?: object): void {
    this.channel.push(`seance:event:${eventName}`, payload);
  }

  private emitEvent(event: LiveEventType, payload?: object) {
    this.stream.push(this.topic, event, payload);
  }

  private emitError(type: LiveErrorType, error?: PhoenixSocketError) {
    this.stream.pushError(this.topic, type, error);
  }

  private setStatus(status: LiveChannelStatus): void {
    this.status = status;
    this.emitEvent("connect", { status: this.status });
  }
}
