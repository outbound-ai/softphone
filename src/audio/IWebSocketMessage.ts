export default interface IWebSocketMessage {
  sequenceNumber: number;
  type: string;
  payload: string;
}