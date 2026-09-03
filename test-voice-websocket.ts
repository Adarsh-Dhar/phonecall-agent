// @ts-check
import WebSocket from 'ws';

const WS_URL = 'ws://localhost:5175/media';

console.log('Testing Voice WebSocket Connection...');
console.log('Connecting to:', WS_URL);

const ws = new WebSocket(WS_URL);

ws.on('open', () => {
  console.log('✓ WebSocket connected');
  
  // Simulate Exotel Voicebot connection
  ws.send(JSON.stringify({
    event: 'connected'
  }));

  // Simulate call start
  setTimeout(() => {
    console.log('Sending start event...');
    ws.send(JSON.stringify({
      event: 'start',
      stream_sid: 'test_stream_123',
      start: {
        call_sid: 'test_call_123',
        from: '033-480-54604',
        to: '+918926130730'
      }
    }));
  }, 1000);

  // Simulate audio stream (empty for test)
  setTimeout(() => {
    console.log('Sending media event (empty audio)...');
    ws.send(JSON.stringify({
      event: 'media',
      stream_sid: 'test_stream_123',
      media: {
        payload: '' // Empty μ-law base64 payload
      }
    }));
  }, 2000);

  // Simulate call end
  setTimeout(() => {
    console.log('Sending stop event...');
    ws.send(JSON.stringify({
      event: 'stop',
      stream_sid: 'test_stream_123',
      stop: {
        call_sid: 'test_call_123'
      }
    }));
  }, 5000);
});

ws.on('message', (data) => {
  try {
    const msg = JSON.parse(data.toString());
    console.log('Received message:', msg.event, msg);
  } catch (e) {
    console.log('Received raw data:', data.toString());
  }
});

ws.on('error', (error) => {
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