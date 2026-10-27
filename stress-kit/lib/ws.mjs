/**
 * WebSocket clients for stress testing
 *
 * Provides business, individual, and observer clients for /media/service
 */

import WebSocket from 'ws';

class WsClient {
  constructor(opts) {
    this.url = opts.url;
    this.token = opts.token;
    this.cookie = opts.cookie;
    this.role = opts.role || 'observer';
    this.ws = null;
    this.messages = [];
    this.connected = false;
    this.receivedClose = false;
  }

  connect() {
    return new Promise((resolve, reject) => {
      const headers = {};

      let url = this.url;
      if (this.token) {
        // Server's upgrade handler reads token from query param or cookie, not Authorization header
        url += `${url.includes('?') ? '&' : '?'}token=${encodeURIComponent(this.token)}`;
      } else if (this.cookie) {
        headers['Cookie'] = this.cookie;
      }

      this.ws = new WebSocket(url, { headers });

      this.ws.on('open', () => {
        this.connected = true;
        resolve();
      });

      this.ws.on('message', (data) => {
        const message = JSON.parse(data.toString());
        this.messages.push(message);
      });

      this.ws.on('close', (code, reason) => {
        this.connected = false;
        this.receivedClose = true;
      });

      this.ws.on('error', (error) => {
        reject(error);
      });
    });
  }

  send(data) {
    if (!this.connected || !this.ws) {
      throw new Error('WebSocket not connected');
    }
    this.ws.send(JSON.stringify(data));
  }

  sendAudioFrame(frame) {
    this.send({ type: 'audio', payload: frame });
  }

  close(code = 1000, reason = '') {
    if (this.ws) {
      this.ws.close(code, reason);
    }
  }

  getMessages(filter = null) {
    if (filter) {
      return this.messages.filter(filter);
    }
    return [...this.messages];
  }

  getRecentMessages(count = 50) {
    return this.messages.slice(-count);
  }

  clearMessages() {
    this.messages = [];
  }

  startCall(callId) {
    this.send({ type: 'start', callId });
  }

  waitForMessage(predicate, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('Timeout waiting for message'));
      }, timeout);

      const check = () => {
        const msg = this.messages.find(predicate);
        if (msg) {
          clearTimeout(timeoutId);
          resolve(msg);
        } else if (!this.connected) {
          clearTimeout(timeoutId);
          reject(new Error('WebSocket disconnected'));
        } else {
          setTimeout(check, 50);
        }
      };

      check();
    });
  }

  disconnect() {
    if (this.ws) {
      this.ws.terminate();
      this.ws = null;
      this.connected = false;
    }
  }
}

class BusinessClient extends WsClient {
  constructor(opts) {
    super({ ...opts, role: 'business' });
  }

  joinCall(callId) {
    this.send({ type: 'start', callId }); // wire protocol: voiceStreamService.ts header
  }

  leaveCall() {
    this.send({ type: 'leave' });
  }
}

class IndividualClient extends WsClient {
  constructor(opts) {
    super({ ...opts, role: 'individual' });
  }

  answerCall(callId) {
    this.send({ type: 'start', callId });
  }

  hangup() {
    this.send({ type: 'hangup' });
  }
}

class ObserverClient extends WsClient {
  constructor(opts) {
    super({ ...opts, role: 'observer' });
  }

  observeCall(callId) {
    this.send({ type: 'observe', callId });
  }

  stopObserving() {
    this.send({ type: 'stop-observe' });
  }
}

export { WsClient, BusinessClient, IndividualClient, ObserverClient };
