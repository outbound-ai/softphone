import SoftPhoneAudioContext from '../audio/SoftPhoneAudioContext';
import SoftPhoneWebSocket, {
  ConnectionStateListener,
  HoldForHumanListener,
  TakeOverStateListener,
  TranscriptListener
} from '../audio/SoftPhoneWebSocket';
import { ITakeOver, BrowserTakeOver } from "../audio/ITakeOver";

export default class Conversation {
  private _socket: SoftPhoneWebSocket;
  private _audio: SoftPhoneAudioContext;

  constructor(softPhoneWebSocket: SoftPhoneWebSocket, softPhoneAudioContext: SoftPhoneAudioContext) {
    this._socket = softPhoneWebSocket;
    this._audio = softPhoneAudioContext;
  }

  get connected(): boolean {
    return this._socket.connected;
  }

  get inputMuted(): boolean {
    return this._audio?.inputMuted;
  }

  get audio() {
    return this._audio;
  }

  get audioCtx() {
    return this._audio?.audioCtx;
  }

  get outputMuted(): boolean {
    return this._audio?.outputMuted;
  }

  public muteInput(): void {
    this._audio?.muteInput(true);
  }

  public unmuteInput(): void {
    if (!this._audio) return;
    this._audio?.enableMicroPhone(true);
    this._audio?.muteInput(false);
  }

  public muteOutput(): void {
    this._audio?.muteOutput(true);
  }

  public unmuteOutput(): void {
    this._audio?.muteOutput(false);
  }

  public synthesizeSpeech(text: string) {
    this._socket.synthesizeSpeech(text);
  }

  public synthesizeTouchTones(sequence: string) {
    this._socket.synthesizeTouchTones(sequence);
  }

  public agentTakeOver(takeOver: ITakeOver = BrowserTakeOver) {
    this._socket.agentTakeOver(takeOver);
  }

  public disconnect() {
    this._audio.stopShowingBrowserAudioIcon()
    this._audio?.enableMicroPhone(false);
    this._socket.disconnect();
  }

  public hangup() {
    this._socket.hangup();
  }

  public set onConnectionStateChanged(listener: ConnectionStateListener) {
    this._socket.connectionStateListener = listener;
  }

  public set onTakeOverStateChanged(listener: TakeOverStateListener) {
    this._socket.takeOverStateListener = listener;
  }

  public set onTranscriptAvailable(listener: TranscriptListener) {
    this._socket.transcriptListener = listener;
  }

  public set onHoldForHumanEvent(listener: HoldForHumanListener) {
    this._socket.holdForHumanListener = listener;
  }
}
