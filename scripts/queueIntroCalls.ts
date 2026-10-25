/**
 * One-off: queue intro calls for individual <-> business pairs that were already mutual before the
 * feature shipped. Needs INTRO_CALL_ENABLED=true. Safe to re-run (each pair is claimed once).
 *
 * Usage:
 *   INTRO_CALL_ENABLED=true npx tsx scripts/queueIntroCalls.ts --dry-run
 *   INTRO_CALL_ENABLED=true npx tsx scripts/queueIntroCalls.ts
 */
import { prisma } from "@workspace/db-prisma";
import { queueIntroCall } from "../artifacts/api-server/src/services/introCall";

async function main() {
  const dryRun = process.argv.includes("--dry-run");

  // Every contact row an individual owns that points at a business account.
  const rows = await prisma.account.findMany({
    where: { isService: true, ownerId: { not: null }, linkedAccountId: { not: null }, owner: { isService: false } },
    select: { ownerId: true, linkedAccountId: true },
  });
  console.log(`Found ${rows.length} individual -> business contacts`);

  let queued = 0;
  let skipped = 0;
  for (const r of rows) {
    if (!r.ownerId || !r.linkedAccountId) continue;
    if (dryRun) {
      const reverse = await prisma.account.findFirst({
        where: { ownerId: r.linkedAccountId, linkedAccountId: r.ownerId, isService: true },
        select: { id: true },
      });
      reverse ? queued++ : skipped++;
      continue;
    }
    const res = await queueIntroCall(r.ownerId, r.linkedAccountId);
    res.queued ? queued++ : skipped++;
  }
  console.log(`${dryRun ? "Would queue" : "Queued"} ${queued}, skipped ${skipped}`);
}

main().finally(() => prisma.$disconnect());
