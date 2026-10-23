/**
 * What should an individual be told before / while dialing a business by hand?
 * - blocked: the business has an active closure that rejects manual calls too.
 * - warning: the business is closed (closure) or outside its hours; the call may still go ahead.
 * Manual calls never consult the individual's own quiet hours.
 */
import { prisma } from "@workspace/db-prisma";
import { isWithinAllowedWindow, resolveEffectiveHours } from "./schedulerPolicy";
import { loadClosureInfo } from "./businessClosures";

export type DialAdvisory = {
  blocked?: { message: string; reopensAt: string | null; kind: string | null; label: string | null };
  warning?: "BUSINESS_CLOSED";
  nextOpenAt?: string | null;
  closure?: { kind: string; label: string | null; message: string | null; reopensAt: string | null };
};

export async function getDialAdvisory(contactId: string, ownerId: string, now = new Date()): Promise<DialAdvisory> {
  const contact = await prisma.account.findFirst({
    where: { id: contactId, ownerId, isService: true },
    select: { businessHoursJson: true, timezone: true, linkedAccountId: true },
  });
  if (!contact) return {};

  const owner = await prisma.account.findUnique({ where: { id: ownerId }, select: { timezone: true } });
  const ownerTz = owner?.timezone || process.env.DEFAULT_TIMEZONE || "UTC";

  const biz = contact.linkedAccountId
    ? await prisma.account.findUnique({
        where: { id: contact.linkedAccountId },
        select: { businessHoursJson: true, timezone: true },
      })
    : null;

  const info = contact.linkedAccountId
    ? (await loadClosureInfo([contact.linkedAccountId], now)).get(contact.linkedAccountId)
    : undefined;
  const active = info?.active ?? null;

  if (active) {
    const reopensAt = active.endsAt ? active.endsAt.toISOString() : null;
    const closure = { kind: active.kind, label: active.label, message: active.message, reopensAt };
    if (active.blockCalls) {
      return {
        blocked: {
          message: active.message || "This business is not taking calls right now.",
          reopensAt,
          kind: active.kind,
          label: active.label,
        },
      };
    }
    return { warning: "BUSINESS_CLOSED", nextOpenAt: reopensAt, closure };
  }

  const { hours } = resolveEffectiveHours({
    contactJson: contact.businessHoursJson,
    businessJson: biz?.businessHoursJson,
    businessTz: biz?.timezone,
    contactTz: contact.timezone,
    ownerTz,
  });
  const check = isWithinAllowedWindow(now, ownerTz, null, null, hours);
  if (!check.allowed && check.nextAllowedTime) {
    return {
      blocked: {
        message: "This business is outside its working hours.",
        reopensAt: check.nextAllowedTime.toISOString(),
        kind: null,
        label: null,
      },
    };
  }
  return {};
}
