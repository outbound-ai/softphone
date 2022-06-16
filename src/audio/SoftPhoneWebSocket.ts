import EventEmitter from 'eventemitter3';
import IWebSocketMessage from './IWebSocketMessage';
import WebSocketMessageType from './WebSocketMessageType';

export type ConnectionStateListener = (connected: boolean) => void;
export type ParticipantStateListener = (participants: Record<string, string>) => void;
export type HoldForHumanListener = (message: string) => void;
export type TranscriptListener = (participantId: string, participantType: string, message: string) => void;

export default class SoftPhoneWebSocket {
  private _connected = false;
  private _hostname: string;
  private _eventEmitter: EventEmitter;
  private _socket?: WebSocket;
  private _participants: Record<string, string> = {};
  private _connectionStateListener?: ConnectionStateListener;
  private _participantStateListener?: ParticipantStateListener;
  private _holdForHumanListener?: HoldForHumanListener;
  private _transcriptListener?: TranscriptListener;

  constructor(hostname: string, eventEmitter: EventEmitter) {
    eventEmitter.on(WebSocketMessageType.OutboundAudio, this.handleOutboundAudio.bind(this));
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
    webSocket.addEventListener('open', this.handleOpen.bind(this));
    webSocket.addEventListener('message', this.handleMessage.bind(this));
    webSocket.addEventListener('close', this.handleClose.bind(this));

    this._socket = webSocket;
    this._connected = true;
  }

  public participants() {
    return this._participants || null;
  }

  public synthesizeSpeech(text: string) {
    const socket = this._socket;

    if (socket && socket.readyState === 1) {
      const message: IWebSocketMessage = {
        sequenceNumber: 0,
        type: WebSocketMessageType.SynthesizeSpeech,
        payload: text,
        participantId: null,
        participantType: null
      };

      socket.send(JSON.stringify(message));
    }
  }

  public synthesizeTouchTones(digits: string) {
    const socket = this._socket;

    if (socket && socket.readyState === 1) {
      const message: IWebSocketMessage = {
        sequenceNumber: 0,
        type: WebSocketMessageType.SynthesizeTouchTone,
        payload: digits,
        participantId: null,
        participantType: null
      };

      socket.send(JSON.stringify(message));
    }
  }

  public set connectionStateListener(listener: ConnectionStateListener) {
    this._connectionStateListener = listener;
  }

  public set participantStateListener(listener: ParticipantStateListener) {
    this._participantStateListener = listener;
  }

  public set holdForHumanListener(listener: HoldForHumanListener) {
    this._holdForHumanListener = listener;
  }

  public set transcriptListener(listener: TranscriptListener) {
    this._transcriptListener = listener;
  }

  public disconnect() {
    if (this._socket) {
      this._socket.close(1000, 'closed by user request');
    }
  }

  public hangup() {
    const socket = this._socket;

    if (socket && socket.readyState === 1) {
      const message: IWebSocketMessage = {
        sequenceNumber: 0,
        type: WebSocketMessageType.Hangup,
        payload: null,
        participantId: null,
        participantType: null
      };

      socket.send(JSON.stringify(message));
    }
  }

  public removeParticipant(participantId: string) {
    const socket = this._socket;

    if (socket && socket.readyState === 1) {
      const message: IWebSocketMessage = {
        sequenceNumber: 0,
        type: WebSocketMessageType.RemoveParticipant,
        payload: participantId,
        participantId: null,
        participantType: null
      };

      socket.send(JSON.stringify(message));
    }
  }

  private handleOpen(): void {
    this._connected = true;
    this._connectionStateListener?.call(this, true);
    this._eventEmitter.emit('socket_open');
    this._eventEmitter.emit('log', 'connection opened');
  }

  private handleMessage(message: MessageEvent): void {
    const parsed: IWebSocketMessage = JSON.parse(message.data);
    const eventEmitter = this._eventEmitter;
    
    if (parsed.type === WebSocketMessageType.Participants && parsed.payload) {
      this._participants = JSON.parse(parsed.payload);
      this._participantStateListener?.call(this, this._participants);
      return;
    }

    if (parsed.type === WebSocketMessageType.Transcript) {
      if (this._transcriptListener && parsed.participantId && parsed.participantType && parsed.payload) {
        this._transcriptListener(parsed.participantId, parsed.participantType, parsed.payload);
      }

      return;
    }

    if (parsed.type === WebSocketMessageType.InboundAudio) {
      eventEmitter.emit(WebSocketMessageType.InboundAudio, parsed);
      return;
    }

    if (parsed.type === WebSocketMessageType.HoldForHuman) {
      eventEmitter.emit(WebSocketMessageType.HoldForHuman, parsed.payload);
      if(this._holdForHumanListener && parsed.payload) {
        this._holdForHumanListener(parsed.payload);
      }
      return;
    }

    if (parsed.type === WebSocketMessageType.TranscriptEventDetection) {
      eventEmitter.emit(WebSocketMessageType.TranscriptEventDetection, 'event detection available');
      return;
    }

    eventEmitter.emit('log', `unrecognized message: ${message.data}`);
  }

  private handleClose() {
    this._connected = false;
    this._connectionStateListener?.call(this, false);
    this._eventEmitter.emit('log', 'connection closed');
  }

  private handleOutboundAudio(message: IWebSocketMessage) {
    const socket = this._socket;

    if (socket && socket.readyState === 1) {
      socket.send(JSON.stringify(message));
    }
  }
}
