/**
 * Small event bus for call status updates.
 * Used to share call status (declined, missed, etc.) between components
 * without opening multiple presence sockets.
 */

type CallStatus = 'ringing' | 'in-progress' | 'declined' | 'missed' | 'ended';

type CallStatusEvent = {
  callId: string;
  status: CallStatus;
};

type Listener = (event: CallStatusEvent) => void;

class CallStatusBus {
  private listeners: Set<Listener> = new Set();
  private lastStatus: Map<string, CallStatus> = new Map();

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    // Immediately notify with last known status for all calls
    this.lastStatus.forEach((status, callId) => {
      listener({ callId, status });
    });
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  publish(event: CallStatusEvent): void {
    this.lastStatus.set(event.callId, event.status);
    this.listeners.forEach((listener) => {
      try {
        listener(event);
      } catch (err) {
        console.error('CallStatusBus: listener error', err);
      }
    });
  }

  getLastStatus(callId: string): CallStatus | undefined {
    return this.lastStatus.get(callId);
  }

  clear(callId: string): void {
    this.lastStatus.delete(callId);
  }
}

// Singleton instance
export const callStatusBus = new CallStatusBus();

// Convenience function for publishing
export function publishCallStatus(callId: string, status: CallStatus): void {
  callStatusBus.publish({ callId, status });
}
