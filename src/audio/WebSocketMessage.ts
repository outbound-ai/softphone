export interface IWebSocketMessage {
  sequenceNumber: number;
  type: string;
  payload: string;
}

export default class WebSocketMessage implements IWebSocketMessage {
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
