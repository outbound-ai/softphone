// import * as fs from 'fs';
import EventEmitter from 'eventemitter3';
import IWebSocketMessage from './IWebSocketMessage';
import WebSocketMessageType from './WebSocketMessageType';

export default class SoftPhoneAudioContext {
  private _muted = true;
  private _eventEmitter: EventEmitter;
  private _context?: AudioContext;
  private _worklet?: IAudioWorkletNode;
  private _gainNode?: GainNode;
  private _audioMuted = false;

  constructor(eventEmitter: EventEmitter) {
    eventEmitter.on(WebSocketMessageType.InboundAudio, this.handleInboundAudio.bind(this));
    this._eventEmitter = eventEmitter;
  }

  public async initializeAsync(): Promise<void> {
    if (!this._context) {
      // This connects a gain node to the audio context.
      const audioContext = new AudioContext({ sampleRate: 8000 });
      const gainNode = audioContext.createGain();
      gainNode.connect(audioContext.destination);
      gainNode.gain.value = 3.0 / 4.0;

      const workletPath = `${process.env.PUBLIC_URL}/softphoneAudioWorklet/SoftPhoneAudioWorklet.js`;

      try {
        await audioContext.audioWorklet.addModule(workletPath);
        const workletNode = new AudioWorkletNode(audioContext, 'softphone-audio-worklet') as IAudioWorkletNode;
        workletNode.port.onmessage = this.handleWorkletMessage.bind(this);
        workletNode.connect(gainNode);

        // This connects the worklet to the microphone.
        const mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        const sourceNode = audioContext.createMediaStreamSource(mediaStream);
        sourceNode.connect(workletNode);

        this._context = audioContext;
        this._worklet = workletNode;
        this._gainNode = gainNode;
      } catch (error) {
        throw Error(
          '\r\n/softphoneAudioWorklet/SoftPhoneAudioWorklet.js missing from the public/ folder, please run:\r\n\r\ncp -r node_modules/@outbound-ai/softphone/lib/audio/softphoneAudioWorklet public/\r\n\r\n from the root directory of your React app to copy the required files'
        );
      }
    }
  }

  public get muted() {
    return this._muted;
  }

  public get audioMuted() {
    return this._audioMuted;
  }

  public mute() {
    if (this._context && this._worklet) {
      const muteParameter = this._worklet.parameters.get('muted');
      muteParameter.setValueAtTime(1, this._context.currentTime);
      this._muted = true;
    }
  }

  public unmute() {
    if (this._context && this._worklet) {
      const muteParameter = this._worklet.parameters.get('muted');
      muteParameter.setValueAtTime(0, this._context.currentTime);
      this._muted = false;
    }
  }

  /**
   *
   * @param volume number between 0 and 1
   */
  public setAudioVolume(volume: number) {
    if (volume < 0 || volume > 1) return;

    if (this._gainNode) {
      this._gainNode.gain.value = volume;

      if (volume === 0) this._audioMuted = true;
      else if (this._audioMuted === true) this._audioMuted = false;
    }
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
