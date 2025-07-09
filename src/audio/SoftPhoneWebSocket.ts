import EventEmitter from 'eventemitter3'
import { BrowserTakeOver, ITakeOver, NoTakeOver } from './ITakeOver'
import IWebSocketMessage from './IWebSocketMessage'
import WebSocketMessageType from './WebSocketMessageType'

export type ConnectionStateListener = (connected: boolean) => void
export type TakeOverStateListener = (takeOver: ITakeOver) => void
export type HoldForHumanListener = (message: string) => void
export type TranscriptListener = (participantId: string, participantType: string, message: string) => void

export default class SoftPhoneWebSocket {
  private _connected = false
  private _hostname: string
  private _eventEmitter: EventEmitter
  private _socket?: WebSocket
  private _takeOver: ITakeOver = NoTakeOver
  private _connectionStateListener?: ConnectionStateListener
  private _takeOverStateListener?: TakeOverStateListener
  private _holdForHumanListener?: HoldForHumanListener
  private _transcriptListener?: TranscriptListener
  private _connectCount = Number('0')
  private _isAudioExist = false

  constructor(hostname: string, eventEmitter: EventEmitter) {
    eventEmitter.on(WebSocketMessageType.OutboundAudio, this.handleOutboundAudio.bind(this))
    this._hostname = hostname
    this._eventEmitter = eventEmitter
  }

  public get connected() {
    return this._connected
  }

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

    const webSocket = new WebSocket(url, ['access_token', accessToken])
    webSocket.addEventListener('open', this.handleOpen.bind(this))
    webSocket.addEventListener('message', this.handleMessage.bind(this))
    webSocket.addEventListener('close', this.handleClose.bind(this))
    webSocket.addEventListener('error', (event) => {
      this.disconnect()
      this.connect(jobId, accessToken)
    })

    this._socket = webSocket
    this._connected = true
  }

  public takeOverState() {
    return this._takeOver
  }

  public synthesizeSpeech(text: string) {
    this.sendMessage({
      sequenceNumber: 0,
      type: WebSocketMessageType.SynthesizeSpeech,
      payload: text,
      participantId: null,
      participantType: null
    })
  }

  public synthesizeTouchTones(digits: string) {
    this.sendMessage({
      sequenceNumber: 0,
      type: WebSocketMessageType.SynthesizeTouchTone,
      payload: digits,
      participantId: null,
      participantType: null
    })
  }

  public set connectionStateListener(listener: ConnectionStateListener) {
    this._connectionStateListener = listener
  }

  public set takeOverStateListener(listener: TakeOverStateListener) {
    this._takeOverStateListener = listener
  }

  public set holdForHumanListener(listener: HoldForHumanListener) {
    this._holdForHumanListener = listener
  }

  public set transcriptListener(listener: TranscriptListener) {
    this._transcriptListener = listener
  }

  public disconnect() {
    if (this._socket) {
      this._socket.close(1000, 'closed by user request')
    }
  }

  public isAudioExist() {
    return this._isAudioExist
  }

  public hangup() {
    this.sendMessage({
      sequenceNumber: 0,
      type: WebSocketMessageType.Hangup,
      payload: null,
      participantId: null,
      participantType: null
    })
  }

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
