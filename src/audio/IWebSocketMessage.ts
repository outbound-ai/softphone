export default interface IWebSocketMessage {
  type: string;
  payload: string | null;
  sequenceNumber: number | null;
  participantId: string | null;
  participantType: string | null;
  utcNow?: string;
}