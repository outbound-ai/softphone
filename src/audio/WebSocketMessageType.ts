export default class WebSocketMessageType {
  static Metadata = 'Metadata';
  static InboundAudio = 'InboundAudio';
  static OutboundAudio = 'OutboundAudio';
  static InboundText = 'InboundText';
  static SynthesizeSpeech = 'SynthesizeSpeech';
  static SynthesizeDtmfSequence = 'SynthesizeDtmfSequence';
  static SynthesizeAlphanumericSequence = 'SynthesizeAlphanumericSequence';
  static Hangup = 'Hangup';
}
