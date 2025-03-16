// background.js
console.log("[YouTubeAdBlock] Background service worker loaded");

let ws;
let adPatterns = [];
let proxyConfig = {};

function connectWebSocket() {
  ws = new WebSocket('ws://203.171.20.166:8080');

  ws.onopen = () => {
    console.log('WebSocket connection established');
    ws.send(JSON.stringify({ type: 'requestConfig' }));
  };

  ws.onmessage = (event) => {
    try {
      const message = JSON.parse(event.data);
      console.log('Message from server:', message);

      if (message.type === 'config') {
        proxyConfig = message.data.proxyConfig;
        adPatterns = message.data.adPatterns;
        console.log('Received proxy config:', proxyConfig);
        console.log('Updated ad patterns:', adPatterns);

        setProxy(proxyConfig);
        updateDynamicRules();
      } else if (message.type === 'adPatterns') {
        adPatterns = message.data;
        updateDynamicRules();
      }
    } catch (e) {
      console.error('Error processing WebSocket message:', e);
    }
  };

  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
  };

  ws.onclose = () => {
    console.log('WebSocket connection closed, retrying...');
    setTimeout(connectWebSocket, 1000);
  };
}

function setProxy(proxyConfig) {
  const config = {
    mode: "fixed_servers",
    rules: {
      singleProxy: {
        scheme: "http",
        host: proxyConfig.host,
        port: parseInt(proxyConfig.port)
      },
      bypassList: ["localhost"]
    }
  };

  chrome.proxy.settings.set(
    { value: config, scope: 'regular' },
    () => {
      console.log('Proxy set to:', proxyConfig);
    }
  );
}

function updateDynamicRules() {
  const rules = adPatterns.map((pattern, index) => ({
    id: index + 100,
    priority: 1,
    action: { type: "block" },
    condition: { urlFilter: pattern }
  }));

  chrome.declarativeNetRequest.updateDynamicRules({
    addRules: rules,
    removeRuleIds: adPatterns.map((_, index) => index + 100)
  }, () => {
    console.log('Dynamic ad blocking rules updated');
  });
}

connectWebSocket();

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'updateAdPatterns' && ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'updateAdPatterns', data: message.data }));
    sendResponse({ status: 'sent' });
  } else if (message.type === 'getAdPatterns') {
    sendResponse({ status: 'success', data: adPatterns });
  } else {
    sendResponse({ status: 'error', message: 'WebSocket not connected or invalid message type' });
  }
});