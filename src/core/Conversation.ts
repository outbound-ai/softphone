import SoftPhoneWebSocket, { TranscriptListener } from '../audio/SoftPhoneWebSocket';
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

  public mute(): void {
    this._audio.mute();
  }

  public unmute(): void {
    this._audio.unmute();
  }

  public sendSynthesizedSpeech(text: string) {
    this._socket.sendSynthesizedSpeech(text);
  }

  public sendDtmfCode(digits: string) {
    this._socket.sendDtmfCode(digits);
  }

  public async removeParticipantAsync(): Promise<void> {
    return Promise.resolve();
  }

  public disconnect() {
    this._socket.disconnect();
  }

  public set onTranscriptAvailable(listener: TranscriptListener) {
    this._socket.transcriptListener = listener;
  }
}
