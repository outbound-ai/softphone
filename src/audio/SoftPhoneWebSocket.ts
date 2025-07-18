// SoftPhoneWebSocket.ts
// Manages the WebSocket connection for the softphone, routing messages
// to appropriate handlers and emitting events for audio, transcripts, takeover, etc.

import EventEmitter from 'eventemitter3'
import { BrowserTakeOver, ITakeOver, NoTakeOver } from './ITakeOver'
import IWebSocketMessage from './IWebSocketMessage'
import WebSocketMessageType from './WebSocketMessageType'

// Listener signatures for external callbacks
export type ConnectionStateListener = (connected: boolean) => void
export type TakeOverStateListener = (takeOver: ITakeOver) => void
export type HoldForHumanListener = (message: string) => void
export type TranscriptListener = (participantId: string, participantType: string, message: string) => void

export default class SoftPhoneWebSocket {
  // Tracks whether the socket is currently open
  private _connected = false

  // Base URL or host for the WebSocket endpoint
  private _hostname: string

  // Shared event emitter used for cross-module events (audio frames, logs)
  private _eventEmitter: EventEmitter

  // Underlying WebSocket instance
  private _socket?: WebSocket

  // Current takeover state (none or browser/agent)
  private _takeOver: ITakeOver = NoTakeOver

  // Optional listeners
  private _connectionStateListener?: ConnectionStateListener
  private _takeOverStateListener?: TakeOverStateListener
  private _holdForHumanListener?: HoldForHumanListener
  private _transcriptListener?: TranscriptListener

  // How many times we have attempted to connect
  private _connectCount = Number('0')

  // Flag to indicate if any inbound audio frames have arrived
  private _isAudioExist = false

  constructor(hostname: string, eventEmitter: EventEmitter) {
    // Listen for outbound audio events from the audio module
    eventEmitter.on(WebSocketMessageType.OutboundAudio, this.handleOutboundAudio.bind(this))
    this._hostname = hostname
    this._eventEmitter = eventEmitter
  }

  // Expose current connection state
  public get connected() {
    return this._connected
  }

  /**
   * Open a new WebSocket connection.
   * Retries up to five times before giving up.
   */
  public connect(jobId: string, accessToken: string) {
    const hostname = this._hostname
    const eventEmitter = this._eventEmitter
    const url = `${hostname}/api/v1/jobs/${jobId}/browser`
    eventEmitter.emit('log', `attempting connection to "${url}"`)

    this._connectCount = this._connectCount + 1
    if (this._connectCount > 5) {
      eventEmitter.emit('log', `connection retry greater than 5, end of retries. Count: "${this._connectCount}"`)
      return
    }

    // Include access token as a subprotocol header
    const webSocket = new WebSocket(url, ['access_token', accessToken])

    // Wire up low-level WebSocket events
    webSocket.addEventListener('open', this.handleOpen.bind(this))
    webSocket.addEventListener('message', this.handleMessage.bind(this))
    webSocket.addEventListener('close', this.handleClose.bind(this))
    webSocket.addEventListener('error', () => {
      this.disconnect()
      this.connect(jobId, accessToken)
    })

    this._socket = webSocket
    this._connected = true
  }

  public takeOverState() {
    return this._takeOver
  }

  // Send a TTS request for the given text
  public synthesizeSpeech(text: string) {
    this.sendMessage({
      sequenceNumber: 0,
      type: WebSocketMessageType.SynthesizeSpeech,
      payload: text,
      participantId: null,
      participantType: null
    })
  }

  // Send DTMF tones (digits)
  public synthesizeTouchTones(digits: string) {
    this.sendMessage({
      sequenceNumber: 0,
      type: WebSocketMessageType.SynthesizeTouchTone,
      payload: digits,
      participantId: null,
      participantType: null
    })
  }

  // Register a listener for connection open/close events
  public set connectionStateListener(listener: ConnectionStateListener) {
    this._connectionStateListener = listener
  }

  // Register a listener for takeover state changes
  public set takeOverStateListener(listener: TakeOverStateListener) {
    this._takeOverStateListener = listener
  }

  public set holdForHumanListener(listener: HoldForHumanListener) {
    this._holdForHumanListener = listener
  }

  public set transcriptListener(listener: TranscriptListener) {
    this._transcriptListener = listener
  }

  //  Close the socket with a normal closure code
  public disconnect() {
    if (this._socket) {
      this._socket.close(1000, 'closed by user request')
    }
  }

  public isAudioExist() {
    return this._isAudioExist
  }

  // Send a hang-up signal to the server
  public hangup() {
    this.sendMessage({
      sequenceNumber: 0,
      type: WebSocketMessageType.Hangup,
      payload: null,
      participantId: null,
      participantType: null
    })
  }

  /**
   * Request the agent (human) to take over the call.
   * Defaults to a browser-based takeover if no argument provided.
   */
  public agentTakeOver(takeOver: ITakeOver = BrowserTakeOver) {
    this.sendMessage({
      sequenceNumber: 0,
      type: WebSocketMessageType.AgentTakeOver,
      payload: JSON.stringify(takeOver),
      participantId: null,
      participantType: null
    })
  }

  private handleOpen(): void {
    this._connected = true
    this._connectionStateListener?.call(this, true)
  }

  private handleMessage(message: MessageEvent): void {
    const parsed: IWebSocketMessage = JSON.parse(message.data)
    const eventEmitter = this._eventEmitter
    if (parsed.type === WebSocketMessageType.TakeOver && parsed.payload) {
      this._takeOver = JSON.parse(parsed.payload)
      this._takeOverStateListener?.call(this, this._takeOver)
      return
    }

    if (parsed.type === WebSocketMessageType.Transcript) {
      if (this._transcriptListener && parsed.participantId && parsed.participantType && parsed.payload) {
        this._transcriptListener(parsed.participantId, parsed.participantType, parsed.payload)
      }

      return
    }

    if (parsed.type === WebSocketMessageType.InboundAudio) {
      if (!this._isAudioExist) {
        this._isAudioExist = true
      }
      eventEmitter.emit(WebSocketMessageType.InboundAudio, parsed)
      return
    }

    if (parsed.type === WebSocketMessageType.HoldForHuman) {
      eventEmitter.emit(WebSocketMessageType.HoldForHuman, parsed.payload)
      if (this._holdForHumanListener && parsed.payload) {
        this._holdForHumanListener(parsed.payload)
      }
      return
    }

    if (parsed.type === WebSocketMessageType.TranscriptEventDetection) {
      eventEmitter.emit(WebSocketMessageType.TranscriptEventDetection, 'event detection available')
      return
    }

    if (parsed.type === WebSocketMessageType.ConnectionHealth) {
      const message: IWebSocketMessage = {
        sequenceNumber: parsed.sequenceNumber,
        type: WebSocketMessageType.ConnectionHealth,
        payload: parsed.payload,
        participantId: parsed.participantId,
        participantType: parsed.participantType
      }
      this.sendMessage(message)
      return
    }

    eventEmitter.emit('log', `unrecognized message: ${message.data}`)
  }

  private handleClose() {
    this._connected = false
    this._connectionStateListener?.call(this, false)
    this._eventEmitter.emit('log', 'connection closed')
  }

  private handleOutboundAudio(message: IWebSocketMessage) {
    this.sendMessage(message)
  }

  private sendMessage(message: IWebSocketMessage) {
    const socket = this._socket

    if (socket && socket.readyState === 1) {
      message.utcNow = new Date().toISOString()
      socket.send(JSON.stringify(message))
    }
  }
}
