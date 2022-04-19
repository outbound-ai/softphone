import Participant from './Participant';
import SoftPhoneWebSocket from '../audio/SoftPhoneWebSocket';
import SoftPhoneAudioContext from '../audio/SoftPhoneAudioContext';

export type OnTranscriptListener = (participantId: string, message: string) => void;

/**
 * Create a new Outbound.Calls.Softphone client.
 */
export default class Conversation {
  private _socket: SoftPhoneWebSocket;
  private _context: SoftPhoneAudioContext;

  constructor(softPhoneWebSocket: SoftPhoneWebSocket, softPhoneAudioContext: SoftPhoneAudioContext) {
    this._socket = softPhoneWebSocket;
    this._context = softPhoneAudioContext;
  }

  get jobId(): string {
    return '';
  }

  get conversationId(): string {
    return '';
  }

  get participants(): Participant[] {
    return [];
  }

  get connected(): boolean {
    return this._socket.connected;
  }

  get muted(): boolean {
    return false;
  }

  public mute(): void {
    throw Error("Not implemented yet.");
  }

  public unmute(): void {
    throw Error("Not implemented yet.");
  }

  public async sendSynthesizedSpeechAsync(digits: string): Promise<void> {
    return Promise.resolve();
  }

  public async sendDtmfCodeAsync(digits: string): Promise<void> {
    return Promise.resolve();
  }

  public async removeParticipantAsync(): Promise<void> {
    return Promise.resolve();
  }

  public disconnect() {
    this._socket.disconnect();
  }

  public set onTranscriptAvailable(listener: OnTranscriptListener) {
    throw Error("Not implemented yet.");
  }
}
