import { prisma } from "@workspace/db-prisma";
import { logger } from "../lib/logger";

export interface ApprovalRuleLite {
  id: string;
  category: string;
  effect: string;
  params: Record<string, unknown> | null;
  note: string | null;
  contactId: string | null;
}

function convertParams(params: unknown): Record<string, unknown> | null {
  if (params === null || params === undefined) return null;
  if (typeof params === "object" && !Array.isArray(params)) {
    return params as Record<string, unknown>;
  }
  return null;
}

export type SlotApproval = ReturnType<typeof createSlotApproval>;

/** Cached call-level rules, loaded once when the call starts. */
export async function loadRulesForCall(ownerId: string, contactId: string | null): Promise<ApprovalRuleLite[]> {
  const rules = await prisma.approvalRule.findMany({
    where: {
      ownerId,
      enabled: true,
      OR: [{ contactId: null }, { contactId }],
    },
    select: {
      id: true,
      category: true,
      effect: true,
      params: true,
      note: true,
      contactId: true,
    },
  });
  return rules.map((r) => ({
    ...r,
    params: convertParams(r.params),
  }));
}

/**
 * Render the rules block for the agent's system instruction.
 * Only rules matching the contact (or global) are shown.
 */
export function renderRulesBlock(
  rules: ApprovalRuleLite[],
  individualName: string,
  contactId?: string
): string {
  const filtered = contactId
    ? rules.filter((r) => r.contactId === null || r.contactId === contactId)
    : rules;

  if (filtered.length === 0) return "";

  const lines = filtered.map((r) => {
    const note = r.note ? ` (${r.note})` : "";
    const contactScope = r.contactId ? "this contact" : "any contact";
    const effectDesc = describeEffect(r.effect, r.params, individualName);
    return `- For ${r.category} with ${contactScope}: ${effectDesc}${note}`;
  });

  return `\n\nSTANDING RULES:\n${lines.join("\n")}\nUse check_approval BEFORE you agree. Follow the rule exactly. If the rule says "ask", call ask_user. If it says "handoff", call request_human_handoff.`;
}

function describeEffect(effect: string, params: Record<string, unknown> | null, individualName: string): string {
  if (effect === "allow") return "you may agree without asking";
  if (effect === "deny") return "you must refuse";
  if (effect === "ask") return `ask ${individualName} before agreeing`;
  if (effect === "handoff") return "call request_human_handoff";
  return effect;
}

/**
 * Slot approval gate for calendar tools.
 * Used by check_availability and hold_slot in agent mode.
 */
export function createSlotApproval(opts: {
  callId: string;
  ownerId: string;
  agentMode: boolean;
  tz: string;
  rules: ApprovalRuleLite[];
}) {
  const slotRules = opts.rules.filter((r) => r.category === "scheduling");

  function decide(start: Date, durationMin: number): {
    decision: "allow" | "deny" | "ask" | "handoff";
    reason: string;
    instruction: string;
  } {
    if (!opts.agentMode) {
      return { decision: "allow", reason: "owner is on the line", instruction: "" };
    }

    // Get time in the owner's timezone
    const tzDate = new Date(start.toLocaleString("en-US", { timeZone: opts.tz }));
    const hour = tzDate.getHours();
    const weekday = tzDate.getDay();

    // Match function for slot rules
    const matches = (p: Record<string, unknown>): boolean =>
      p.type === "any" ||
      (p.type === "after_hour" && typeof p.hour === "number" && hour >= p.hour) ||
      (p.type === "before_hour" && typeof p.hour === "number" && hour < p.hour) ||
      (p.type === "weekends" && (weekday === 0 || weekday === 6)) ||
      (p.type === "outside_hours" && (hour < 9 || hour >= 18 || weekday === 0 || weekday === 6));

    // Collect all matching rules
    const hit = slotRules.filter(r => {
      const p = r.params as Record<string, unknown> || {};
      return matches(p);
    });

    // Pick by precedence: deny > handoff > allow > ask
    const pick = (e: string) => hit.find(r => r.effect === e);
    const r = pick("deny") ?? pick("handoff") ?? pick("allow") ?? pick("ask");

    if (r) {
      const p = r.params as Record<string, unknown> || {};
      if (r.effect === "deny") {
        if (p.type === "outside_hours") {
          return { decision: "deny", reason: "rule: deny outside business hours", instruction: "You may not accept a slot outside 9am-6pm weekdays." };
        }
        if (p.type === "weekends") {
          return { decision: "deny", reason: "rule: deny weekends", instruction: "You may not accept a weekend slot." };
        }
        if (p.type === "before_hour" && typeof p.hour === "number") {
          return { decision: "deny", reason: `rule: deny before ${p.hour}:00`, instruction: `You may not accept a slot before ${p.hour}:00.` };
        }
        if (p.type === "after_hour" && typeof p.hour === "number") {
          return { decision: "deny", reason: `rule: deny after ${p.hour}:00`, instruction: `You may not accept a slot after ${p.hour}:00.` };
        }
        return { decision: "deny", reason: "rule: deny scheduling", instruction: "You may not accept this slot." };
      }
      if (r.effect === "handoff") {
        return { decision: "handoff", reason: "rule: handoff for scheduling", instruction: "Call request_human_handoff so your user can handle this." };
      }
      if (r.effect === "allow") {
        return { decision: "allow", reason: "rule: allow scheduling", instruction: "" };
      }
      if (r.effect === "ask") {
        if (p.type === "outside_hours") {
          return { decision: "ask", reason: "rule: ask before accepting outside hours", instruction: "Ask your user before accepting this time." };
        }
        if (p.type === "weekends") {
          return { decision: "ask", reason: "rule: ask before accepting weekends", instruction: "Ask your user before accepting this weekend slot." };
        }
        return { decision: "ask", reason: "rule: ask before scheduling", instruction: "Ask your user before accepting this slot." };
      }
    }

    return { decision: "allow", reason: "no rule blocks this", instruction: "" };
  }

  function record(
    verdict: ReturnType<typeof decide>,
    detail: { startsAt: string; via: string }
  ): void {
    void prisma.ruleDecision
      .create({
        data: {
          callId: opts.callId,
          ownerId: opts.ownerId,
          category: "scheduling",
          decision: verdict.decision,
          source: detail.via,
          detail,
        },
      })
      .catch((err: unknown) => logger.error({ err }, "approvalRules: failed to record decision"));
  }

  return { decide, record };
}

/**
 * Call-level approval checker for the check_approval tool.
 * Handles scheduling, money, personal_info, commitment, other.
 * Always include amount for money and startsAt for scheduling.
 */
export function createCallApproval(opts: {
  callId: string;
  ownerId: string;
  agentMode: boolean;
  tz: string;
  rules: ApprovalRuleLite[];
}) {
  const slot = createSlotApproval(opts);

  async function handle(args: unknown): Promise<Record<string, unknown>> {
    if (!opts.agentMode) {
      return { decision: "allow", reason: "owner is on the line", instruction: "" };
    }

    const a = args as {
      category: string;
      startsAt?: string;
      durationMin?: number;
      amount?: number;
      currency?: string;
      description?: string;
    };

    // Fail closed on unknown category
    if (!a.category) {
      return { decision: "ask", reason: "missing category", instruction: "Ask your user." };
    }

    // Money: unknown amount is treated as "could be any amount"
    if (a.category === "money") {
      const amount = Number.isFinite(a.amount) ? Number(a.amount) : Infinity;
      const deny = opts.rules.find(r => r.category === "money" && r.effect === "deny");
      if (deny) {
        return { decision: "deny", reason: "rule: never commit money", instruction: "You may not agree to any payment or fee." };
      }
      const ask = opts.rules.find(r => r.category === "money" && r.effect === "ask");
      if (ask && amount > Number(ask.params?.threshold ?? 0)) {
        return { decision: "ask", reason: "rule: ask before large payment", instruction: "Ask your user before agreeing to this payment." };
      }
      const allow = opts.rules.find(r => r.category === "money" && r.effect === "allow");
      if (allow) {
        const threshold = Number(allow.params?.threshold ?? 0);
        if (amount > threshold) {
          return { decision: "ask", reason: "rule: ask above threshold", instruction: "Ask your user before agreeing to this payment." };
        }
        return { decision: "allow", reason: "rule: allow up to threshold", instruction: "" };
      }
      return { decision: "ask", reason: "no money rule: ask by default", instruction: "Ask your user before agreeing to any payment." };
    }

    // Scheduling: no usable time but a scheduling rule exists -> ask, don't allow
    if (a.category === "scheduling") {
      const start = a.startsAt ? new Date(a.startsAt) : null;
      if (!start || isNaN(+start)) {
        const slotRules = opts.rules.filter(r => r.category === "scheduling");
        return slotRules.length
          ? { decision: "ask", reason: "time not verifiable", instruction: "Ask your user." }
          : { decision: "allow", reason: "no scheduling rules", instruction: "" };
      }
      const verdict = slot.decide(start, a.durationMin ?? 30);
      slot.record(verdict, { startsAt: a.startsAt || "", via: "check_approval" });
      return verdict;
    }

    if (a.category === "personal_info") {
      const deny = opts.rules.find(r => r.category === "personal_info" && r.effect === "deny");
      if (deny) {
        return { decision: "deny", reason: "rule: deny sharing personal information", instruction: "You may not share personal information." };
      }
      const ask = opts.rules.find(r => r.category === "personal_info" && r.effect === "ask");
      if (ask) {
        return { decision: "ask", reason: "rule: ask before sharing personal information", instruction: "Ask your user before sharing personal information." };
      }
    }

    if (a.category === "commitment") {
      const handoff = opts.rules.find(r => r.category === "commitment" && r.effect === "handoff");
      if (handoff) {
        return { decision: "handoff", reason: "rule: handoff for commitments", instruction: "Call request_human_handoff so your user can handle this." };
      }
      const deny = opts.rules.find(r => r.category === "commitment" && r.effect === "deny");
      if (deny) {
        return { decision: "deny", reason: "rule: deny commitments", instruction: "You may not make commitments." };
      }
    }

    if (a.category === "other") {
      const deny = opts.rules.find(r => r.category === "other" && r.effect === "deny");
      if (deny) {
        return { decision: "deny", reason: "rule: deny this action", instruction: "You may not proceed with this action." };
      }
      const ask = opts.rules.find(r => r.category === "other" && r.effect === "ask");
      if (ask) {
        return { decision: "ask", reason: "rule: ask before this action", instruction: "Ask your user before proceeding." };
      }
    }

    // Fail closed on unknown category
    return { decision: "ask", reason: "unknown category: ask by default", instruction: "Ask your user before proceeding." };
  }

  return { handle, slot };
}
