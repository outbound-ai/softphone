export default class Participant {
  _participantId: string;
  _type: string;

  constructor(participantId: string, type: string) {
    this._participantId = participantId;
    this._type = type;
  }

  get id(): string {
    return this._participantId;
  }

  get type(): string {
    return this._participantId;
  }
}
