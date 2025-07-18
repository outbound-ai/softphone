// Performs a simple WebSocket-based round-trip time (RTT) latency test

interface IPingSessionMessage {
  messageType: string
}

interface IPingSessionEchoMessage extends IPingSessionMessage {
  echo?: string
}

export default class Monitoring {
  private static _isConnected = false

  // Initializes a WebSocket connection that periodically sends echo messages
  // and logs the round-trip time upon receiving the echo back.
  // hostname Base URL of server
  // accessToken Token for authenticating the WebSocket handshake
  static initWebSocketLatencyTest(hostname: string, accessToken: string) {
    if (Monitoring._isConnected) return

    const url = `${hostname}/api/v1/pingresponder/some-id-for-this-device-or-user`

    // Open WebSocket, passing accessToken as a subprotocol for auth
    const webSocket = new WebSocket(url, ['access_token', accessToken])

    // Will hold the timer for sending ping messages
    let sendPing: NodeJS.Timeout | null

    // Handle connection open event
    webSocket.addEventListener('open', () => {
      console.log('Monitoring connection to the web socket opened')

      // If another connection is active, close this one silently
      if (Monitoring._isConnected) {
        console.log('Silently closing a new ws connection because another one is already established')
        return webSocket.close()
      }
      Monitoring._isConnected = true

      // Every 5 seconds, send an echo message with current timestamp
      sendPing = setInterval(() => {
        const echoMessage: IPingSessionEchoMessage = {
          messageType: 'echo',
          // might want to use something finer-grained than milliseconds.
          echo: new Date().toISOString()
        }
        webSocket.send(JSON.stringify(echoMessage))
      }, 5000)
    })

    webSocket.addEventListener('message', (message: MessageEvent) => {
      const nowDate = new Date()
      const pingSessionMessage: IPingSessionEchoMessage = JSON.parse(message.data)

      const thenString = pingSessionMessage.echo
      if (!thenString) {
        console.log(`Warning: Ping message lacked origination time.`)
        return
      }

      // Handle connection close event
      const thenTime = Date.parse(thenString)
      const elapsedTime = nowDate.getTime() - thenTime
      console.log(`RTT ${elapsedTime}ms`)
    })

    webSocket.addEventListener('close', () => {
      console.log('Monitoring connection to the web socket closed')
      Monitoring._isConnected = false
      if (sendPing) clearInterval(sendPing)
    })
  }
}
