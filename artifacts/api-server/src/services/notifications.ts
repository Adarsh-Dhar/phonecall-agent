/**
 * Notifications WebSocket — a lightweight, one-directional (server → browser)
 * channel separate from the call transport in voiceStreamBrowser.ts.
 *
 * Right now it carries exactly one message type: "call_due", pushed by
 * services/callScheduler.ts when a task's due date arrives. The browser
 * listens on this while the app is open (see hooks/useCallDueNotifications.ts
 * on the frontend) and reacts by auto-opening the call widget for that task.
 *
 * This does NOT deliver to a closed tab or a phone that isn't looking at the
 * app — there is no push-notification/service-worker layer here. It only
 * reaches whatever browser tabs currently hold an open connection.
 */

import { WebSocketServer, WebSocket } from "ws";
import { logger } from "../lib/logger";

const clients = new Set<WebSocket>();

export function createNotificationsStream(): WebSocketServer {
  const wss = new WebSocketServer({ noServer: true });

  wss.on("connection", (ws: WebSocket) => {
    clients.add(ws);
    logger.info({ clientCount: clients.size }, "notifications: client connected");

    ws.on("close", () => {
      clients.delete(ws);
      logger.info({ clientCount: clients.size }, "notifications: client disconnected");
    });

    ws.on("error", (err) => {
      logger.warn({ err }, "notifications: client socket error");
      clients.delete(ws);
    });
  });

  return wss;
}

export type CallDueNotification = {
  type: "call_due";
  taskId: string;
  contactId: string;
  contactName: string;
  title: string;
  description: string | null;
};

/**
 * Sends a call_due notification to every currently-connected browser tab.
 * Returns how many clients actually received it, so the caller can log
 * when a due task had nobody around to pick it up.
 */
export function broadcastCallDue(payload: CallDueNotification): number {
  const message = JSON.stringify(payload);
  let delivered = 0;
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(message);
        delivered++;
      } catch (err) {
        logger.warn({ err }, "notifications: failed to send to a client");
      }
    }
  }
  return delivered;
}
