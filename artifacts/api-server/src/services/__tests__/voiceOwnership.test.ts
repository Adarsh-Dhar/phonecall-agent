/**
 * Security test for voice WebSocket ownership enforcement
 *
 * Tests that:
 * 1. User A cannot access User B's contact via the browser voice socket
 * 2. Client-sent userId in messages is ignored (only authenticated userId is used)
 */

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { prisma } from "@workspace/db-prisma";
import { createBrowserVoiceStream } from "../voiceStreamBrowser";
import { WebSocket as WSClient } from "ws";
import { createServer, type Server as HTTPServer } from "http";

// Mock Gemini and lifecycle to prevent actual calls
vi.mock("../geminiVoiceSession", () => ({
  openGeminiLiveSession: vi.fn().mockResolvedValue({
    sendAudio: vi.fn(),
    close: vi.fn(),
  }),
}));

vi.mock("../callLifecycle", () => ({
  createCallLifecycle: vi.fn().mockReturnValue({
    noteAudioOut: vi.fn(),
    logTurn: vi.fn(),
    onAskUser: vi.fn().mockResolvedValue('USER_UNAVAILABLE'),
    onEndCall: vi.fn(),
    onGeminiClosed: vi.fn(),
    end: vi.fn().mockResolvedValue(undefined),
  }),
}));

describe("Voice WebSocket Ownership Security", () => {
  let userA: string;
  let userB: string;
  let contactA: string;
  let contactB: string;
  let httpServer: HTTPServer;
  let serverPort: number;

  beforeAll(async () => {
    // Create two individual users
    const accountA = await prisma.account.create({
      data: {
        isService: false,
        googleId: "test-google-a",
        email: "user-a@test.com",
        name: "User A",
      },
    });
    userA = accountA.id;

    const accountB = await prisma.account.create({
      data: {
        isService: false,
        googleId: "test-google-b",
        email: "user-b@test.com",
        name: "User B",
      },
    });
    userB = accountB.id;

    // Create a service contact for each user
    const contactForA = await prisma.account.create({
      data: {
        isService: true,
        ownerId: userA,
        name: "Contact A",
        business: "Business A",
        category: "Other",
        phone: "555-0001",
        initials: "CA",
        color: "#ff0000",
      },
    });
    contactA = contactForA.id;

    const contactForB = await prisma.account.create({
      data: {
        isService: true,
        ownerId: userB,
        name: "Contact B",
        business: "Business B",
        category: "Other",
        phone: "555-0002",
        initials: "CB",
        color: "#00ff00",
      },
    });
    contactB = contactForB.id;

    // Create HTTP server on random port
    httpServer = createServer();
    await new Promise<void>((resolve) => {
      httpServer.listen(0, () => {
        const addr = httpServer.address();
        if (addr && typeof addr === 'object') {
          serverPort = addr.port;
        }
        resolve();
      });
    });
  });

  afterAll(async () => {
    // Cleanup
    await prisma.account.deleteMany({
      where: {
        id: { in: [userA, userB, contactA, contactB] },
      },
    });
    httpServer.close();
  });

  it("should reject user A accessing user B's contact via WebSocket", async () => {
    const wss = createBrowserVoiceStream();

    // Set up upgrade handler to authenticate as user A
    httpServer.removeAllListeners('upgrade');
    httpServer.on('upgrade', (req, socket, head) => {
      (req as any).userId = userA; // Authenticate as user A
      wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit('connection', ws, req);
      });
    });

    // Connect as user A
    const ws = new WSClient(`ws://localhost:${serverPort}/media/browser`);

    await new Promise<void>((resolve) => {
      ws.on('open', resolve);
    });

    // Try to start a call with user B's contact
    ws.send(JSON.stringify({
      type: "start",
      contactId: contactB,
    }));

    // Should receive error and close
    const messages: any[] = [];
    ws.on('message', (data) => {
      messages.push(JSON.parse(data.toString()));
    });

    await new Promise((resolve) => setTimeout(resolve, 200));

    const errorMsg = messages.find(m => m.type === 'error');
    expect(errorMsg).toBeDefined();
    expect(errorMsg?.message).toContain('not found or not owned');

    // Wait for socket to close
    await new Promise((resolve) => setTimeout(resolve, 100));
    ws.close();
  });

  it("should ignore spoofed userId in message", async () => {
    const wss = createBrowserVoiceStream();

    httpServer.removeAllListeners('upgrade');
    httpServer.on('upgrade', (req, socket, head) => {
      (req as any).userId = userA; // Authenticate as user A
      wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit('connection', ws, req);
      });
    });

    const ws = new WSClient(`ws://localhost:${serverPort}/media/browser`);

    await new Promise<void>((resolve) => {
      ws.on('open', resolve);
    });

    // Send spoofed userId in message (should be ignored)
    ws.send(JSON.stringify({
      type: "start",
      userId: userB, // Spoofed - should be ignored
    }));

    const messages: any[] = [];
    ws.on('message', (data) => {
      messages.push(JSON.parse(data.toString()));
    });

    await new Promise((resolve) => setTimeout(resolve, 200));

    // Should not get an error (uses authenticated userA's ID)
    const errorMsg = messages.find(m => m.type === 'error');
    expect(errorMsg).toBeUndefined();

    // Verify that any contact created belongs to user A, not user B
    const browserTestContact = await prisma.account.findFirst({
      where: { name: "Browser Test", ownerId: userA, isService: true },
    });
    expect(browserTestContact).toBeDefined();
    expect(browserTestContact?.ownerId).toBe(userA);

    // User B should not have a new Browser Test contact
    const userBBrowserTest = await prisma.account.findFirst({
      where: { name: "Browser Test", ownerId: userB, isService: true },
    });
    expect(userBBrowserTest).toBeNull();

    ws.close();
  });
});
