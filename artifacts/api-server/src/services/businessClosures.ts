/**
 * Database-side helpers for business closures (holidays, emergencies, out of service).
 * The pure rules live in closurePolicy.ts.
 */
import { prisma } from "@workspace/db-prisma";
import { activeClosure, closureStatus } from "./closurePolicy";

export type ClosureRow = {
  id: string;
  businessId: string;
  kind: string;
  label: string | null;
  message: string | null;
  startsAt: Date;
  endsAt: Date | null;
  allDay: boolean;
  blockCalls: boolean;
};

export type PublicClosure = {
  id: string;
  kind: string;
  label: string | null;
  message: string | null;
  startsAt: string;
  endsAt: string | null; // null = until the business reopens
  allDay: boolean;
  blockCalls: boolean;
  status: "active" | "upcoming" | "past";
};

export function toPublicClosure(row: ClosureRow, now: Date): PublicClosure {
  return {
    id: row.id,
    kind: row.kind,
    label: row.label,
    message: row.message,
    startsAt: row.startsAt.toISOString(),
    endsAt: row.endsAt ? row.endsAt.toISOString() : null,
    allDay: row.allDay,
    blockCalls: row.blockCalls,
    status: closureStatus(row, now),
  };
}

export type ClosureInfo = { active: ClosureRow | null; upcoming: ClosureRow[] };

/** Active closure and the next few upcoming ones for each business, in one query. */
export async function loadClosureInfo(
  businessIds: string[],
  now: Date,
  upcomingLimit = 3,
): Promise<Map<string, ClosureInfo>> {
  const result = new Map<string, ClosureInfo>();
  if (businessIds.length === 0) return result;

  const rows = (await prisma.businessClosure.findMany({
    where: { businessId: { in: businessIds }, OR: [{ endsAt: null }, { endsAt: { gt: now } }] },
    orderBy: { startsAt: "asc" },
  })) as ClosureRow[];

  const byBusiness = new Map<string, ClosureRow[]>();
  for (const r of rows) {
    const list = byBusiness.get(r.businessId) ?? [];
    list.push(r);
    byBusiness.set(r.businessId, list);
  }
  for (const id of businessIds) {
    const list = byBusiness.get(id) ?? [];
    result.set(id, {
      active: activeClosure(list, now),
      upcoming: list.filter((r) => r.startsAt.getTime() > now.getTime()).slice(0, upcomingLimit),
    });
  }
  return result;
}

/** The shape individuals see on a contact. */
export function closureForIndividual(info: ClosureInfo | undefined, now: Date) {
  if (!info) return { closure: null, upcomingClosures: [] as PublicClosure[] };
  return {
    closure: info.active
      ? {
          kind: info.active.kind,
          label: info.active.label,
          message: info.active.message,
          reopensAt: info.active.endsAt ? info.active.endsAt.toISOString() : null,
          blockCalls: info.active.blockCalls,
        }
      : null,
    upcomingClosures: info.upcoming.map((r) => toPublicClosure(r, now)),
  };
}
