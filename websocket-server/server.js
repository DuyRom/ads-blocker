const express = require('express');
const WebSocket = require('ws');
const http = require('http');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = 8080;

const proxyConfig = {
  host: "mitmproxy", // Tên service trong docker-compose
  port: 8081
};

let adPatterns = [
  "youtube.com/api/stats/ads",
  "googlevideo.com.*&oad",
  "youtube.com/pagead",
  "youtube.com/ptracking",
  "s.youtube.com/api/stats/qoe?adcontext"
];

wss.on('connection', (ws) => {
  console.log('New client connected');
  ws.send(JSON.stringify({ type: 'config', data: { proxyConfig, adPatterns } }));

  ws.on('message', (message) => {
    try {
      const parsedMessage = JSON.parse(message);
      console.log(`Received: ${JSON.stringify(parsedMessage)}`);

      if (parsedMessage.type === 'updateAdPatterns') {
        adPatterns = parsedMessage.data;
        wss.clients.forEach(client => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type: 'adPatterns', data: adPatterns }));
          }
        });
      } else if (parsedMessage.type === 'requestConfig') {
        ws.send(JSON.stringify({ type: 'config', data: { proxyConfig, adPatterns } }));
      }
    } catch (e) {
      console.error('Error processing message:', e);
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

app.get('/', (req, res) => {
  res.send('WebSocket Server is running');
});

server.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});