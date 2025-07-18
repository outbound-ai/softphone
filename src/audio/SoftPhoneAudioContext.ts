// SoftPhoneAudioContext.ts
// Handles inbound and outbound audio streams via Web Audio API worklet
// and routes audio messages between browser media devices and WebSocket.

import EventEmitter from 'eventemitter3'
import IWebSocketMessage from './IWebSocketMessage'
import WebSocketMessageType from './WebSocketMessageType'

// SoftPhoneAudioContext encapsulates Web Audio API setup and message routing
export default class SoftPhoneAudioContext {
  // Whether microphone input is muted
  private _inputMuted = true

  private _eventEmitter: EventEmitter
  private _context?: AudioContext

  // AudioWorklet node for custom audio processing
  private _worklet?: IAudioWorkletNode

  // GainNode for controlling output volume
  private _gainNode?: GainNode

  // Whether speaker output is muted
  private _outputMuted = false

  // MediaStream from getUserMedia (microphone stream)
  private _mediaStream?: MediaStream

  /**
   * Constructor registers inbound audio listener
   * eventEmitter Shared emitter for audio and control events
   */
  constructor(eventEmitter: EventEmitter) {
    eventEmitter.on(WebSocketMessageType.InboundAudio, this.handleInboundAudio.bind(this))
    this._eventEmitter = eventEmitter
  }

  /**
   * Initialize the audio context and audio worklet if not already created.
   * micDeviceId Optional deviceId string to select specific microphone
   */
  public async initializeAsync(micDeviceId?: string | null): Promise<void> {
    if (!this._context) {
      // This connects a gain node to the audio context.
      const audioContext = new AudioContext({ sampleRate: 8000 })
      this._context = audioContext

      if (audioContext.state !== 'suspended') {
        try {
          await this.createAudioWorklet(micDeviceId)
        } catch (error) {
          console.log('error', error)
        }
      }
    }
    // }
  }

  /**
   * Loads the SoftPhone audio worklet, connects microphone and gain nodes.
   * micDeviceId Optional deviceId for selecting input device
   */
  public async createAudioWorklet(micDeviceId?: string | null) {
    if (!this._context) return

    const gainNode = this._context.createGain()

    // Connect gain node to AudioContext's destination (speakers)
    gainNode.connect(this._context.destination)

    // Set default volume to 75%
    gainNode.gain.value = 3.0 / 4.0

    // Path to the worklet JS file in public folder
    const workletPath = `${process.env.PUBLIC_URL}/softphoneAudioWorklet/SoftPhoneAudioWorklet.js`
    await this._context.audioWorklet.addModule(workletPath).catch((error) => {
      this._eventEmitter.emit(
        'log',
        '\r\n/softphoneAudioWorklet/SoftPhoneAudioWorklet.js missing from the public/ folder, please run:\r\n\r\ncp -r node_modules/@outbound-ai/softphone/lib/audio/softphoneAudioWorklet public/\r\n\r\n from the root directory of your React app to copy the required files'
      )
      throw error
    })

    // Instantiate the worklet node for audio processing
    const workletNode = new AudioWorkletNode(this._context, 'softphone-audio-worklet') as IAudioWorkletNode
    workletNode.port.onmessage = this.handleWorkletMessage.bind(this)
    workletNode.connect(gainNode)

    try {
      // This connects the worklet to the microphone.
      this._mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: { deviceId: micDeviceId || 'default' },
        video: false
      })
      const sourceNode = this._context.createMediaStreamSource(this._mediaStream)
      sourceNode.connect(workletNode)
    } catch (error) {
      this._eventEmitter.emit('log', 'User has denied access to the microphone.')
      throw error
    }

    this._worklet = workletNode
    this._gainNode = gainNode
  }

  // returns Whether microphone input is currently muted
  public get inputMuted() {
    return this._inputMuted
  }

  // returns Whether speaker output is currently muted
  public get outputMuted() {
    return this._outputMuted
  }

  public get audioCtx() {
    return this._context
  }

  public muteInput(mute: boolean) {
    if (this._context && this._worklet) {
      const value = mute ? 1 : 0
      const muteParameter = this._worklet.parameters.get('muted')
      muteParameter.setValueAtTime(value, this._context.currentTime)
      this._inputMuted = mute
    }
  }

  public muteOutput(mute: boolean) {
    if (this._gainNode) {
      const value = mute ? 0 : 3.0 / 4.0

      this._gainNode.gain.value = value
      this._outputMuted = mute
    }
  }

  public enableMicroPhone(enable: boolean) {
    this._mediaStream?.getAudioTracks().forEach((track) => (track.enabled = enable))
  }

  public hideBrowserAudioIcon() {
    this._mediaStream?.getAudioTracks().forEach((track) => track.stop())
  }

  private handleInboundAudio(message: IWebSocketMessage) {
    if (this._worklet) {
      this._worklet.port.postMessage(message)
    }
  }

  private handleWorkletMessage(event: MessageEvent<Uint8Array>) {
    this._eventEmitter.emit(WebSocketMessageType.OutboundAudio, event.data)
  }
}
