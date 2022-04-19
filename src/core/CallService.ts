import Conversation from './Conversation';
import EventEmitter from 'eventemitter3';
import SoftphoneWebSocket from '../audio/SoftPhoneWebSocket';
import SoftPhoneAudioContext from '../audio/SoftPhoneAudioContext';

export type OnLogListener = (message: string) => void;

export default class CallService {
  private static EventEmitter: EventEmitter = new EventEmitter();
  private static SoftphoneAudioContext: SoftPhoneAudioContext;
  private _hostname: string;

  constructor(hostname: string) {
    this._hostname = hostname;
  }

  async getConversationAsync(jobId: string): Promise<Conversation> {
    if (CallService.SoftphoneAudioContext == null) {
      CallService.SoftphoneAudioContext = new SoftPhoneAudioContext(CallService.EventEmitter);
      await CallService.SoftphoneAudioContext.initializeAsync();
    }

    const webSocket = new SoftphoneWebSocket(this._hostname, CallService.EventEmitter);
    webSocket.connect(jobId);
    const conversation = new Conversation(webSocket, CallService.SoftphoneAudioContext);
    return Promise.resolve(conversation);
  }

  set onLog(listener: OnLogListener) {
    CallService.EventEmitter.addListener('log', listener);
  }
}
