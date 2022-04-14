# Call Service Javascript Client
This is a placeholder for the call service client NPM package.

# Example Usage
```javascript
// Import the package.
import CallService from "whatever-package";

// Start a job and join the current conversation.
const slotMappings = { "patient_id": "12345abc" }
const job = await CallService.createJobAsync("InteractiveIvr", "4194903803", slotMappings);
const conversation = await CallService.connectAsync(job.jobId);

// Get the conversation metadata.
conversation.conversationId     // The conversation you joined.
conversation.jobId              // The job that owns the conversation.
conversation.participantId      // Your own participant id.
conversation.participants       // A key/value map of all the participant ids => participant type in the conversation


// Manipulate the conversation.
conversation.removeParticipantAsync("00000000-0000-0000-0000000000");   // All participants have a unique id specific to the conversation.
conversation.sendSynthesizedSpeechAsync("Hello world.");                // Same behavior as if the IVR Agent did it.
conversation.sendDtmfCodeAsync("123abc");                               // Same behavior as if the IVR Agent did it.
conversation.hangUpAsync();                                             // Not clear if this disconnects you, or ends the call for all participants.

// Handle events.
conversation.onTranscriptAvailable += (participantId, message) => {
  // If participantId == conversation.participantId then you are the originator. Otherwise
  // it's safe to assume the virtual agent is the originator. If we ever have a call with
  // multiple softphones or virtual agent participants you will need to consult with
  // conversation.participants to try and decipher who said what.
}
```

# Build NPM Package
> npm install
> npm run build

# Run Demonstration
> npm install
> npm run serve
> open http://localhost:9000/call-service-client/