// High‑level interface tying together audio processing and signaling for a call session.
import { BrowserTakeOver, ITakeOver } from '../audio/ITakeOver'
import SoftPhoneAudioContext from '../audio/SoftPhoneAudioContext'
import SoftPhoneWebSocket, {
  ConnectionStateListener,
  HoldForHumanListener,
  TakeOverStateListener,
  TranscriptListener
} from '../audio/SoftPhoneWebSocket'

//Conversation manages a live call by coordinating between the audio worklet
//and the WebSocket signaling layer. It exposes simple methods to control
//mute, unmute, synthesis, and connection events for consumer code.
export default class Conversation {
  // Underlying WebSocket connection handling signaling and audio frames.
  private _socket: SoftPhoneWebSocket

  // Manages microphone input, audio routing, and playback via Web Audio API.
  private _audio: SoftPhoneAudioContext

  // softPhoneWebSocket Instance handling websocket events & messaging
  // softPhoneAudioContext Instance managing audio I/O
  constructor(softPhoneWebSocket: SoftPhoneWebSocket, softPhoneAudioContext: SoftPhoneAudioContext) {
    this._socket = softPhoneWebSocket
    this._audio = softPhoneAudioContext
  }

  // returns true if the WebSocket connection is open
  get connected(): boolean {
    return this._socket.connected
  }

  // returns true if microphone input is currently muted
  get inputMuted(): boolean {
    return this._audio?.inputMuted
  }

  // returns underlying audio context for advanced controls
  get audio() {
    return this._audio
  }

  get audioCtx() {
    return this._audio?.audioCtx
  }

  // returns true if speaker output is muted
  get outputMuted(): boolean {
    return this._audio?.outputMuted
  }

  public muteInput(): void {
    this._audio?.muteInput(true)
  }

  // Unmute microphone and enable media track
  public unmuteInput(): void {
    if (!this._audio) return
    this._audio?.enableMicroPhone(true)
    this._audio?.muteInput(false)
  }

  public muteOutput(): void {
    this._audio?.muteOutput(true)
  }

  public unmuteOutput(): void {
    this._audio?.muteOutput(false)
  }

  // Send text to be synthesized into speech over the call
  public synthesizeSpeech(text: string) {
    this._socket.synthesizeSpeech(text)
  }

  // Send DTMF digits (touch tones) over the call
  public synthesizeTouchTones(sequence: string) {
    this._socket.synthesizeTouchTones(sequence)
  }

  public agentTakeOver(takeOver: ITakeOver = BrowserTakeOver) {
    this._socket.agentTakeOver(takeOver)
  }

  //Disconnects audio and signaling:
  // Stops microphone stream to remove browser audio icon
  // Disables mic track
  // Closes WebSocket connection
  public disconnect() {
    this._audio.stopShowingBrowserAudioIcon()
    this._audio?.enableMicroPhone(false)
    this._socket.disconnect()
  }

  public hangup() {
    this._socket.hangup()
  }

  // returns true if any inbound audio frames have been received
  public isAudioExist(): boolean {
    return this._socket.isAudioExist()
  }

  // Register a callback for connection open/close events
  // listener Called with true when connected, false when disconnected
  public set onConnectionStateChanged(listener: ConnectionStateListener) {
    this._socket.connectionStateListener = listener
  }

  public set onTakeOverStateChanged(listener: TakeOverStateListener) {
    this._socket.takeOverStateListener = listener
  }

  public set onTranscriptAvailable(listener: TranscriptListener) {
    this._socket.transcriptListener = listener
  }

  public set onHoldForHumanEvent(listener: HoldForHumanListener) {
    this._socket.holdForHumanListener = listener
  }
}
