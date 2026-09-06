import { prisma } from "@workspace/db-prisma";
import { logger } from "../lib/logger";
import { WebSocket } from "ws";

const sockets = new Map<string, Set<WebSocket>>(); // accountId -> tabs

export function registerPresence(accountId: string, ws: WebSocket): void {
  if (!sockets.has(accountId)) sockets.set(accountId, new Set());
  sockets.get(accountId)!.add(ws);
  logger.info({ accountId, socketCount: sockets.get(accountId)!.size }, "User presence registered");
  void markOnline(accountId, true);
}

export function unregisterPresence(accountId: string, ws: WebSocket): void {
  sockets.get(accountId)?.delete(ws);
  const remainingSockets = sockets.get(accountId)?.size ?? 0;
  logger.info({ accountId, remainingSockets }, "User presence unregistered");
  
  if (remainingSockets === 0) {
    sockets.delete(accountId);
    // Consider a 5s debounce for reloads to avoid flickering
    setTimeout(() => {
      if (!isOnline(accountId)) {
        logger.info({ accountId }, "Marking user offline after debounce");
        void markOnline(accountId, false);
      }
    }, 5000);
  }
}

export function isOnline(accountId: string): boolean {
  const conns = sockets.get(accountId);
  if (!conns) return false;
  for (const ws of conns) {
    if (ws.readyState === WebSocket.OPEN) return true;
  }
  return false;
}

export function sendToAccount(accountId: string, payload: unknown): boolean {
  const conns = sockets.get(accountId);
  if (!conns?.size) return false;
  const msg = JSON.stringify(payload);
  let delivered = 0;
  for (const ws of conns) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(msg);
      delivered++;
    } else {
      // Prune dead/stale sockets so they don't keep reporting as "online"
      conns.delete(ws);
    }
  }
  if (conns.size === 0) sockets.delete(accountId);
  logger.info({ accountId, delivered }, "sendToAccount: dispatch result");
  return delivered > 0;
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