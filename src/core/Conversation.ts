import SoftPhoneWebSocket, {
  ConnectionStateListener,
  ParticipantStateListener,
  HoldForHumanListener,
  TranscriptListener
} from '../audio/SoftPhoneWebSocket';
import SoftPhoneAudioContext from '../audio/SoftPhoneAudioContext';

export default class Conversation {
  private _socket: SoftPhoneWebSocket;
  private _audio: SoftPhoneAudioContext;

  constructor(softPhoneWebSocket: SoftPhoneWebSocket, softPhoneAudioContext: SoftPhoneAudioContext) {
    this._socket = softPhoneWebSocket;
    this._audio = softPhoneAudioContext;
  }

  get participants() {
    return this._socket.participants;
  }

  get connected(): boolean {
    return this._socket.connected;
  }

  get inputMuted(): boolean {
    return this._audio.inputMuted;
  }

  get audio() {
    return this._audio;
  }

  get audioCtx() {
    return this._audio.audioCtx;
  }

  get outputMuted(): boolean {
    return this._audio.outputMuted;
  }

  public muteInput(): void {
    this._audio.muteInput(true);
  }

  public unmuteInput(): void {
    this._audio.enableMicroPhone(true);
    this._audio.muteInput(false);
  }

  public muteOutput(): void {
    this._audio.muteOutput(true);
  }

  public unmuteOutput(): void {
    this._audio.muteOutput(false);
  }

  public synthesizeSpeech(text: string) {
    this._socket.synthesizeSpeech(text);
  }

  public synthesizeTouchTones(sequence: string) {
    this._socket.synthesizeTouchTones(sequence);
  }

  public agentTakeOver(phoneNumber: string | null = null) {
    this._socket.agentTakeOver(phoneNumber);
  }

  public removeParticipant(participantId: string) {
    this._socket.removeParticipant(participantId);
  }

  public disconnect() {
    this._audio.enableMicroPhone(false);
    this._socket.disconnect();
  }

  public hangup() {
    this._socket.hangup();
  }

  public set onConnectionStateChanged(listener: ConnectionStateListener) {
    this._socket.connectionStateListener = listener;
  }

  public set onParticipantStateChanged(listener: ParticipantStateListener) {
    this._socket.participantStateListener = listener;
  }

  public set onTranscriptAvailable(listener: TranscriptListener) {
    this._socket.transcriptListener = listener;
  }

  public set onHoldForHumanEvent(listener: HoldForHumanListener) {
    this._socket.holdForHumanListener = listener;
  }
}
