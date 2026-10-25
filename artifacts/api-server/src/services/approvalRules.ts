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

    for (const rule of slotRules) {
      const p = rule.params as Record<string, unknown> || {};
      if (rule.effect === "deny") {
        if (p.type === "outside_hours" && (hour < 9 || hour >= 18 || weekday === 0 || weekday === 6)) {
          return {
            decision: "deny",
            reason: "rule: deny outside business hours",
            instruction: "You may not accept a slot outside 9am-6pm weekdays.",
          };
        }
        if (p.type === "weekends" && (weekday === 0 || weekday === 6)) {
          return {
            decision: "deny",
            reason: "rule: deny weekends",
            instruction: "You may not accept a weekend slot.",
          };
        }
        if (p.type === "before_hour" && typeof p.hour === "number" && hour < p.hour) {
          return {
            decision: "deny",
            reason: `rule: deny before ${p.hour}:00`,
            instruction: `You may not accept a slot before ${p.hour}:00.`,
          };
        }
        if (p.type === "after_hour" && typeof p.hour === "number" && hour >= p.hour) {
          return {
            decision: "deny",
            reason: `rule: deny after ${p.hour}:00`,
            instruction: `You may not accept a slot after ${p.hour}:00.`,
          };
        }
      }
      if (rule.effect === "ask") {
        if (p.type === "outside_hours" && (hour < 9 || hour >= 18 || weekday === 0 || weekday === 6)) {
          return {
            decision: "ask",
            reason: "rule: ask before accepting outside hours",
            instruction: "Ask your user before accepting this time.",
          };
        }
        if (p.type === "weekends" && (weekday === 0 || weekday === 6)) {
          return {
            decision: "ask",
            reason: "rule: ask before accepting weekends",
            instruction: "Ask your user before accepting this weekend slot.",
          };
        }
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

    if (a.category === "scheduling" && a.startsAt && a.durationMin) {
      const start = new Date(a.startsAt);
      const verdict = slot.decide(start, a.durationMin);
      slot.record(verdict, { startsAt: a.startsAt, via: "check_approval" });
      return verdict;
    }

    if (a.category === "money" && a.amount !== undefined) {
      const denyRule = opts.rules.find((r) => r.category === "money" && r.effect === "deny");
      if (denyRule) {
        return {
          decision: "deny",
          reason: "rule: deny all money commitments",
          instruction: "You may not agree to any payment or fee.",
        };
      }
      const askRule = opts.rules.find((r) => r.category === "money" && r.effect === "ask");
      if (askRule) {
        const threshold = typeof askRule.params === "object" && askRule.params?.threshold
          ? Number(askRule.params.threshold)
          : 0;
        if (a.amount > threshold) {
          return {
            decision: "ask",
            reason: "rule: ask before agreeing to payments above threshold",
            instruction: "Ask your user before agreeing to this payment.",
          };
        }
      }
    }

    if (a.category === "personal_info") {
      const rule = opts.rules.find((r) => r.category === "personal_info" && r.effect === "deny");
      if (rule) {
        return {
          decision: "deny",
          reason: "rule: deny sharing personal information",
          instruction: "You may not share personal information.",
        };
      }
    }

    if (a.category === "commitment") {
      const rule = opts.rules.find((r) => r.category === "commitment" && r.effect === "handoff");
      if (rule) {
        return {
          decision: "handoff",
          reason: "rule: handoff for commitments",
          instruction: "Call request_human_handoff so your user can handle this.",
        };
      }
    }

    return { decision: "allow", reason: "no rule blocks this", instruction: "" };
  }

  return { handle, slot };
}
