import Participant from "./Participant";
import Promise from "promise";

/**
 * Create a new Outbound.Calls.Softphone client.
 */
export default class Conversation {
  get jobId(): string {
    return "";
  }

  get conversationId(): string {
    return "";
  }

  get participants(): Array<Participant> {
    return [];
  }

  toggleMicrophoneMuteState(): void {

  }

  sendSynthesizedSpeechAsync(digits: string): Promise<void> {
    return Promise.resolve();
  }

  sendDtmfCodeAsync(digits: string): Promise<void> {
    return Promise.resolve();
  }

  removeParticipantAsync(): Promise<void> {
    return Promise.resolve();
  }

  hangupAsync(): Promise<void> {
    return Promise.resolve();
  }
}