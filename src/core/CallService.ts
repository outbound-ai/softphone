// Orchestrates audio context setup, WebSocket connection, and conversation lifecycle
import EventEmitter from 'eventemitter3'
import SoftPhoneAudioContext from '../audio/SoftPhoneAudioContext'
import SoftphoneWebSocket from '../audio/SoftPhoneWebSocket'
import Conversation from './Conversation'

export type OnLogListener = (message: string) => void

export default class CallService {
  // Shared EventEmitter for audio and log events across instances
  private static EventEmitter: EventEmitter = new EventEmitter()

  // Singleton SoftPhoneAudioContext to manage microphone and audio routing
  private static SoftphoneAudioContext: SoftPhoneAudioContext
  private _hostname: string

  // hostname Base URL of the server for WebSocket connections
  constructor(hostname: string) {
    this._hostname = hostname
  }

  //   Set up audio context, WebSocket, and return a Conversation instance.
  //   jobId Unique identifier for the call job/session
  //   accessToken Token used to authenticate WebSocket connection
  //   micDeviceId Optional microphone device ID to select specific mic
  //   returns Promise resolving to a Conversation controller for this call
  async getConversationAsync(jobId: string, accessToken: string, micDeviceId?: string | null): Promise<Conversation> {
    if (CallService.SoftphoneAudioContext) {
      await CallService.SoftphoneAudioContext.audioCtx?.close()
    }
    CallService.SoftphoneAudioContext = new SoftPhoneAudioContext(CallService.EventEmitter)
    await CallService.SoftphoneAudioContext.initializeAsync(micDeviceId)

    const webSocket = new SoftphoneWebSocket(this._hostname, CallService.EventEmitter)
    webSocket.connect(jobId, accessToken)
    const conversation = new Conversation(webSocket, CallService.SoftphoneAudioContext)
    return Promise.resolve(conversation)
  }
  // Allow consumers to subscribe to log messages (progress, errors, informational)
  // listener Callback receiving log string messages
  set onLog(listener: OnLogListener) {
    CallService.EventEmitter.addListener('log', listener)
  }
}
