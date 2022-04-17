import EventEmitter from 'eventemitter3';

export class WebSocketMessageType {
  static Metadata: string = "Metadata";
  static InboundAudio: string = "InboundAudio";
  static OutboundAudio: string = "OutboundAudio";
  static InboundText: string = "InboundText";
  static OutboundText: string = "OutboundText";
}

export interface IWebSocketMessage {
  sequenceNumber: number;
  type: string;
  payload: string;
}

export class WebSocketMessage implements IWebSocketMessage {
  private _sequenceNumber: number;
  private _type: string;
  private _payload: string;

  constructor(sequenceNumber: number, type: string, payload: string) {
    this._sequenceNumber = sequenceNumber;
    this._type = type;
    this._payload = payload;
  }

  get sequenceNumber(): number {
    return this._sequenceNumber;
  }

  get type(): string {
    return this._type;
  }

  get payload(): string {
    return this._payload;
  }
}

export default class SoftPhoneWebSocket {
  private _sequenceNumber: number = 0;
  private _connected: boolean = false;
  private _hostname: string;
  private _eventEmitter: EventEmitter;
  private _socket?: WebSocket;

  constructor(hostname: string, eventEmitter: EventEmitter) {
    eventEmitter.on('socket_outbound_audio', this.handleOutboundAudio);
    this._hostname = hostname;
    this._eventEmitter = eventEmitter;
  }

  public get connected() {
    return this._connected;
  }

  public connect(jobId: string) {
    const hostname = this._hostname;
    const eventEmitter = this._eventEmitter;
    const url = `${hostname}/api/v1/jobs/${jobId}/browser`;
    eventEmitter.emit('log', `attempting connection to "${url}"`);

    const webSocket = new WebSocket(url);
    webSocket.addEventListener("open", this.handleOpen.bind(this));
    webSocket.addEventListener("message", this.handleMessage.bind(this));
    webSocket.addEventListener("close", this.handleClose.bind(this));

    this._socket = webSocket;
  }

  public disconnect() {
    if (this._socket) {
      this._socket.close(1000, "closed by user request");
    }
  }

  private handleOpen(): void {
    this._connected = true;
    this._eventEmitter.emit("socket_open");
    this._eventEmitter.emit('log', 'connection opened');
  }

  private handleMessage(message: MessageEvent): void {
    const parsed: IWebSocketMessage = JSON.parse(message.data);
    const eventEmitter = this._eventEmitter;

    if (parsed.type === WebSocketMessageType.Metadata) {
      eventEmitter.emit(WebSocketMessageType.Metadata, parsed);
      return;
    }

    if (parsed.type === WebSocketMessageType.InboundText) {
      eventEmitter.emit(WebSocketMessageType.InboundText, parsed);
      return;
    }

    if (parsed.type === WebSocketMessageType.InboundAudio) {
      eventEmitter.emit(WebSocketMessageType.InboundAudio, parsed);
      return;
    }

    eventEmitter.emit('log', `unrecognized message: ${message.data}`);
  }

  private handleClose() {
    this._connected = false;
    this._eventEmitter.emit('log', 'connection closed');
  }

  private handleOutboundAudio(message: IWebSocketMessage) {
    const socket = this._socket;

    if (socket && socket.readyState === 1) {
      socket.send(JSON.stringify(message));
    }
  }
}
