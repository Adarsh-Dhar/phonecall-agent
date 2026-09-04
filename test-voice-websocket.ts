// @ts-check
//
// Manual smoke test for the browser voice WebSocket (services/voiceStreamBrowser.ts).
// Connects, starts a session (creating a real Call row against the "Browser
// Test" contact), sends one empty audio frame, then stops. Useful to confirm
// the server accepts connections and the Gemini session opens without
// needing a real browser + microphone.
//
// Run with: npx tsx test-voice-websocket.ts   (or ts-node, etc.)

import WebSocket from 'ws';

const WS_URL = 'ws://localhost:5175/media/browser';

console.log('Testing Browser Voice WebSocket Connection...');
console.log('Connecting to:', WS_URL);

const ws = new WebSocket(WS_URL);

ws.on('open', () => {
  console.log('✓ WebSocket connected');

  // Start a session — server creates/reuses the "Browser Test" contact,
  // a Conversation, and a Call row, then opens the Gemini Live session.
  console.log('Sending start event...');
  ws.send(JSON.stringify({ type: 'start' }));

  // Simulate a chunk of mic audio (empty raw-PCM16 16kHz payload for this smoke test).
  setTimeout(() => {
    console.log('Sending audio event (empty payload)...');
    ws.send(JSON.stringify({ type: 'audio', payload: '' }));
  }, 2000);

  // End the call — server marks the Call "completed" and runs post-call analysis.
  setTimeout(() => {
    console.log('Sending stop event...');
    ws.send(JSON.stringify({ type: 'stop' }));
  }, 5000);
});

ws.on('message', (data: Buffer) => {
  try {
    const msg = JSON.parse(data.toString());
    console.log('Received message:', msg.type, msg);
  } catch (e) {
    console.log('Received raw data:', data.toString());
  }
});

ws.on('error', (error: Error) => {
  console.error('WebSocket error:', error);
});

ws.on('close', () => {
  console.log('WebSocket connection closed');
});

// Test duration: 10 seconds
setTimeout(() => {
  console.log('Test completed, closing connection...');
  ws.close();
  // @ts-ignore - process.exit is available at runtime
  process.exit(0);
}, 10000);