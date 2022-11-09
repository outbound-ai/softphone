export default class Monitoring {
  static initWebSocketLatencyTest(hostname: string, accessToken: string) {
    const url = `${hostname}/api/v1/monitoring/browser`;

    const webSocket = new WebSocket(url, ['access_token', accessToken]);
    webSocket.addEventListener('open', () => console.log('Monitoring connection to the web socket opened'));

    webSocket.addEventListener('message', (message: MessageEvent) => {
      console.log('message', message);
      webSocket.send(
        JSON.stringify({
          timestamp: new Date().toISOString()
        })
      );
    });

    webSocket.addEventListener('close', () => console.log('Monitoring connection to the web socket closed'));
  }
}
