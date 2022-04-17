import EventEmitter from 'eventemitter3';
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

  get participants(): Array<Participant> {
    return [];
  }

  get connected(): boolean {
    return this._socket.connected;
  }

  get muted(): boolean {
    return false;
  }

  toggleMicrophoneMuteState(): void { }

  async sendSynthesizedSpeechAsync(digits: string): Promise<void> {
    return Promise.resolve();
  }

  async sendDtmfCodeAsync(digits: string): Promise<void> {
    return Promise.resolve();
  }

  async removeParticipantAsync(): Promise<void> {
    return Promise.resolve();
  }

  disconnect() {
    this._socket.disconnect();
  }

  async hangupAsync(): Promise<void> {
    return Promise.resolve();
  }

  set onTranscriptAvailable(listener: OnTranscriptListener) {
  }
}
