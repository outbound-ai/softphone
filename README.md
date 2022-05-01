# Call Service Browser Softphone Client
This is a placeholder for the call service client NPM package.

# Example Usage
This is the currently proposed NPM package interface.

```javascript

// Import the package and configure the URL. You should only create one instance of 
// the call service per browser tab and use it for all the callse.
import CallService from "whatever-package";
const callService = new CallService("ws(s)://callservice.host.com");

// To join a conversation, you need to have the call's job id.
const conversation = await callService.getConversationAsync("00000000-0000-0000-0000-0000000000");
conversation.connected    // This will become true as long as the conversation is connected.

// You can control the outbound audio using the following methods.
conversation.muted;       // The mute state.
conversation.mute();      // Mute the microphone.
conversation.unmute();    // Unmute the microphone.
conversation.sendSynthesizedSpeech("Hello world.");                     // Send a synthesized audio response generated from text.
conversation.sendDtmfCode("123abc");                                    // Send the dial tone audio signals represented by the text.

// You can control the conversation using these methods.
conversation.participants();                                            // Retrieves metadata about the call participants.
conversation.removeParticipantAsync("00000000-0000-0000-0000000000");   // Removes a participant from the call.
conversation.disconnect();                                              // This leaves the call without interrupting it.
conversation.hangUpAsync();                                             // This ends the call for all participants.

// You can recieve incoming chat transcripts throuch this event handler.
conversation.onTranscriptAvailable += (participantId, message) => {
  // If participantId == conversation.participantId then you are the originator. Otherwise
  // it's safe to assume the virtual agent is the originator. If we ever have a call with
  // multiple softphones or virtual agent participants you will need to consult with
  // conversation.participants to try and decipher who said what.
}
```

# Build NPM Package
```bash
> npm install
> npm run format
> npm run lint
> npm run test
> npm run build
```

# Run Demonstration Application
```bash
> npm install
> npm run serve
> open http://localhost:9000/call-service-client/
```
