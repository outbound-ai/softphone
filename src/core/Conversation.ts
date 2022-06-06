import SoftPhoneWebSocket, {
  ConnectionStateListener,
  ParticipantStateListener,
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

  get muted(): boolean {
    return this._audio.muted;
  }

  get audio() {
    return this._audio;
  }

  get audioMuted(): boolean {
    return this._audio.audioMuted;
  }

  public mute(): void {
    this._audio.mute();
  }

  public unmute(): void {
    this._audio.unmute();
  }

  public muteAudio(): void {
    this._audio.setAudioVolume(0);
  }

  public unmuteAudio(): void {
    this._audio.setAudioVolume(3.0 / 4.0);
  }

  public synthesizeSpeech(text: string) {
    this._socket.synthesizeSpeech(text);
  }

  public synthesizeTouchTones(sequence: string) {
    this._socket.synthesizeTouchTones(sequence);
  }

  public removeParticipant(participantId: string) {
    this._socket.removeParticipant(participantId);
  }

  public disconnect() {
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
}
