interface IPingSessionMessage {
    messageType: string
}

interface IPingSessionEchoMessage extends IPingSessionMessage {
    echo?: string
}

export default class Monitoring {
    static initWebSocketLatencyTest(hostname: string, accessToken: string) {
        const url = `${hostname}/api/v1/pingresponder/some-id-for-this-device-or-user`;

        const webSocket = new WebSocket(url, ['access_token', accessToken]);

        let sendPing: NodeJS.Timer | null;
        webSocket.addEventListener('open', () => {
            console.log('Monitoring connection to the web socket opened')
            sendPing = setInterval(() => {
                const echoMessage: IPingSessionEchoMessage = {
                    messageType: 'echo',
                    // might want to use something finer-grained than milliseconds.
                    echo: new Date().toISOString(),
                }
                webSocket.send(JSON.stringify(echoMessage))
            }, 5000)
        })

        webSocket.addEventListener('message', (message: MessageEvent) => {
            const nowDate = new Date()
            const pingSessionMessage:IPingSessionEchoMessage = JSON.parse(message.data)
            const thenString = pingSessionMessage.echo
            const thenTime = Date.parse(thenString!)
            const elapsedTime = nowDate.getTime()-thenTime
            console.log(`RTT ${elapsedTime}ms`)
        })

        webSocket.addEventListener('close', () => {
            console.log('Monitoring connection to the web socket closed')
            if (sendPing)
                clearInterval(sendPing)
        });
    }
}
