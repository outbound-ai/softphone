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