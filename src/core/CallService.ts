import Conversation from "./Conversation";
import Promise from "promise";

export default class CallService {
  _socketUrl: string;

  constructor(socketUrl: string) {
    this._socketUrl = socketUrl;
  }

  createJobAsync(/* TBD but probably a job type, phone number and the initial slot mappings. */): Promise<string> {
    return Promise.resolve("00000000-0000-0000-00000000000");
  }

  connectJobAsync(jobId: string): Promise<Conversation> {
    return Promise.resolve(new Conversation());
  }
}

async function() {

import CallService from "whatever-package";

// Start a job and join the most recent conversation of the job.
const job = await CallService.crateJobAsync("InteractiveIvr", "4194903803", slotParameters);
const conversation = await CallService.connectAsync(job.jobId);

// Get conversation metadata.
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

}