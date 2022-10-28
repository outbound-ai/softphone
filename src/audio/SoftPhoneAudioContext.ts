// import * as fs from 'fs';
import EventEmitter from 'eventemitter3';
import IWebSocketMessage from './IWebSocketMessage';
import WebSocketMessageType from './WebSocketMessageType';

export default class SoftPhoneAudioContext {
  private _inputMuted = true;
  private _eventEmitter: EventEmitter;
  private _context?: AudioContext;
  private _worklet?: IAudioWorkletNode;
  private _gainNode?: GainNode;
  private _outputMuted = false;
  private _mediaStream?: MediaStream;

  constructor(eventEmitter: EventEmitter) {
    eventEmitter.on(WebSocketMessageType.InboundAudio, this.handleInboundAudio.bind(this));
    this._eventEmitter = eventEmitter;
  }

  public async initializeAsync(midDeviceId?: string | null): Promise<void> {
    // if (!this._context) {
    // This connects a gain node to the audio context.
    const audioContext = new AudioContext({ sampleRate: 8000 });
    this._context = audioContext;

    if (audioContext.state !== 'suspended') {
      try {
        await this.createAudioWorklet(midDeviceId);
      } catch (error) {
        console.error(error);
        throw Error(
          '\r\n/softphoneAudioWorklet/SoftPhoneAudioWorklet.js missing from the public/ folder, please run:\r\n\r\ncp -r node_modules/@outbound-ai/softphone/lib/audio/softphoneAudioWorklet public/\r\n\r\n from the root directory of your React app to copy the required files'
        );
      }
    }
    // }
  }

  public async createAudioWorklet(micDeviceId?: string | null) {
    if (!this._context) return;

    const gainNode = this._context.createGain();
    gainNode.connect(this._context.destination);
    gainNode.gain.value = 3.0 / 4.0;

    const workletPath = `${process.env.PUBLIC_URL}/softphoneAudioWorklet/SoftPhoneAudioWorklet.js`;
    await this._context.audioWorklet.addModule(workletPath);
    const workletNode = new AudioWorkletNode(this._context, 'softphone-audio-worklet') as IAudioWorkletNode;
    workletNode.port.onmessage = this.handleWorkletMessage.bind(this);
    workletNode.connect(gainNode);
    // This connects the worklet to the microphone.
    this._mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: { deviceId: micDeviceId || 'default' },
      video: false
    });
    const sourceNode = this._context.createMediaStreamSource(this._mediaStream);
    sourceNode.connect(workletNode);

    this._worklet = workletNode;
    this._gainNode = gainNode;
  }

  public get inputMuted() {
    return this._inputMuted;
  }

  public get outputMuted() {
    return this._outputMuted;
  }

  public get audioCtx() {
    return this._context;
  }

  public muteInput(mute: boolean) {
    if (this._context && this._worklet) {
      const value = mute ? 1 : 0;
      const muteParameter = this._worklet.parameters.get('muted');
      muteParameter.setValueAtTime(value, this._context.currentTime);
      this._inputMuted = mute;
    }
  }

  public muteOutput(mute: boolean) {
    if (this._gainNode) {
      const value = mute ? 0 : 3.0 / 4.0;

      this._gainNode.gain.value = value;
      this._outputMuted = mute;
    }
  }

  public enableMicroPhone(enable: boolean) {
    console.log('enable', enable);
    // this._mediaStream?.getAudioTracks().forEach((track) => (track.enabled = enable));
    console.log('this._mediaStream?.getAudioTracks()', this._mediaStream?.getAudioTracks());
    this._mediaStream?.getAudioTracks().forEach((track) => track.stop());
    this._worklet?.disconnect();
    this._worklet = undefined;
    this._mediaStream = undefined;
  }

  private handleInboundAudio(message: IWebSocketMessage) {
    if (this._worklet) {
      this._worklet.port.postMessage(message);
    }
  }

  private handleWorkletMessage(event: MessageEvent<Uint8Array>) {
    this._eventEmitter.emit(WebSocketMessageType.OutboundAudio, event.data);
  }
}
