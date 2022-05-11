import EventEmitter from 'eventemitter3';
import IWebSocketMessage from './IWebSocketMessage';
import WebSocketMessageType from './WebSocketMessageType';

export default class SoftPhoneAudioContext {
  private _muted = true;
  private _eventEmitter: EventEmitter;
  private _context?: AudioContext;
  private _worklet?: IAudioWorkletNode;

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

      // The audio worklet interfaces with the audio hardware.
      await audioContext.audioWorklet.addModule('./bundled/SoftPhoneAudioWorklet.js');
      const workletNode = new AudioWorkletNode(audioContext, 'softphone-audio-worklet') as IAudioWorkletNode;
      workletNode.port.onmessage = this.handleWorkletMessage.bind(this);
      workletNode.connect(gainNode);

      // This connects the worklet to the microphone.
      const mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      const sourceNode = audioContext.createMediaStreamSource(mediaStream);
      sourceNode.connect(workletNode);

      this._context = audioContext;
      this._worklet = workletNode;
    }
  }

  public get muted() {
    return this._muted;
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

  private handleInboundAudio(message: IWebSocketMessage) {
    if (this._worklet) {
      this._worklet.port.postMessage(message);
    }
  }

  private handleWorkletMessage(event: MessageEvent<Uint8Array>) {
    this._eventEmitter.emit(WebSocketMessageType.OutboundAudio, event.data);
  }
}
