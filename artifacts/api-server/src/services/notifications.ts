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
 * 
 * DEPRECATED: This file is being replaced by the presence registry system
 * in presence.ts. The broadcastCallDue function now uses sendToAccount
 * to target specific users instead of broadcasting to all connected clients.
 */

import { WebSocketServer, WebSocket } from "ws";
import { logger } from "../lib/logger";
import { sendToAccount } from "./presence";

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
 * Sends a call_due notification to the specific account that owns the task.
 * Uses the presence registry to target the right user instead of broadcasting.
 * Returns true if the notification was delivered, false if the user is offline.
 */
export function broadcastCallDue(payload: CallDueNotification & { ownerId: string }): boolean {
  return sendToAccount(payload.ownerId, payload);
}
