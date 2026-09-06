import { prisma } from "@workspace/db-prisma";
import { logger } from "../lib/logger";
import { WebSocket } from "ws";

const sockets = new Map<string, Set<WebSocket>>(); // accountId -> tabs

export function registerPresence(accountId: string, ws: WebSocket): void {
  if (!sockets.has(accountId)) sockets.set(accountId, new Set());
  sockets.get(accountId)!.add(ws);
  void markOnline(accountId, true);
}

export function unregisterPresence(accountId: string, ws: WebSocket): void {
  sockets.get(accountId)?.delete(ws);
  if (sockets.get(accountId)?.size === 0) {
    sockets.delete(accountId);
    // Consider a 5s debounce for reloads to avoid flickering
    setTimeout(() => {
      if (!isOnline(accountId)) {
        void markOnline(accountId, false);
      }
    }, 5000);
  }
}

export function isOnline(accountId: string): boolean {
  return (sockets.get(accountId)?.size ?? 0) > 0;
}

export function sendToAccount(accountId: string, payload: unknown): boolean {
  const conns = sockets.get(accountId);
  if (!conns?.size) return false;
  const msg = JSON.stringify(payload);
  for (const ws of conns) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(msg);
    }
  }
  return true;
}

async function markOnline(accountId: string, online: boolean): Promise<void> {
  try {
    await prisma.account.update({
      where: { id: accountId },
      data: { 
        online,
        lastSeenAt: online ? new Date() : undefined,
      },
    });
  } catch (error) {
    logger.error({ error, accountId, online }, "Failed to update account online status");
  }
}