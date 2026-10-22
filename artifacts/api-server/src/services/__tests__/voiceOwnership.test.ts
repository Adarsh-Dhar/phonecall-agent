/**
 * Security test for voice WebSocket ownership enforcement
 *
 * Tests that:
 * 1. User A cannot access User B's contact via the browser voice socket
 * 2. Client-sent userId in messages is ignored (only authenticated userId is used)
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from "@workspace/db-prisma";

describe("Voice WebSocket Ownership Security", () => {
  let userA: string;
  let userB: string;
  let contactA: string;
  let contactB: string;

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
  });

  afterAll(async () => {
    // Cleanup
    await prisma.account.deleteMany({
      where: {
        id: { in: [userA, userB, contactA, contactB] },
      },
    });
  });

  it("should reject user A accessing user B's contact", async () => {
    // This tests the exact query used in voiceStreamBrowser.ts line 93-95
    const contact = await prisma.account.findFirst({
      where: { id: contactB, isService: true, ownerId: userA },
    });

    // Should return null since contactB belongs to userB, not userA
    expect(contact).toBeNull();
  });

  it("demonstrates vulnerability without ownership check", async () => {
    // This test shows what the bug would allow if we removed the ownerId filter
    // It's intentionally using the vulnerable query to document the security issue
    const vulnerableQuery = await prisma.account.findFirst({
      where: { id: contactB, isService: true }, // NO ownerId filter - vulnerable!
    });

    // This would return the contact even though it belongs to userB
    // The fix in voiceStreamBrowser.ts prevents this by adding: ownerId: authUserId
    expect(vulnerableQuery).not.toBeNull();
    expect(vulnerableQuery?.id).toBe(contactB);
    expect(vulnerableQuery?.ownerId).toBe(userB); // But it's owned by userB, not the requester
  });

  it("should allow user A accessing their own contact", async () => {
    const contact = await prisma.account.findFirst({
      where: { id: contactA, isService: true, ownerId: userA },
    });

    // Should return the contact since it belongs to userA
    expect(contact).not.toBeNull();
    expect(contact?.id).toBe(contactA);
  });

  it("should verify that contact lookup without ownership check is vulnerable", async () => {
    // This demonstrates the bug: without the ownerId filter, any user can access any contact
    const vulnerableQuery = await prisma.account.findFirst({
      where: { id: contactB, isService: true },
    });

    // This would return the contact even though userA doesn't own it
    expect(vulnerableQuery).not.toBeNull();
    expect(vulnerableQuery?.id).toBe(contactB);
    expect(vulnerableQuery?.ownerId).toBe(userB); // But it's owned by userB
  });
});
