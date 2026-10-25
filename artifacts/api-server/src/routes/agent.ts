import { Router } from "express";
import { prisma } from "@workspace/db-prisma";
import { logger } from "../lib/logger";

const router = Router();

/**
 * GET /agent/rules
 * List all approval rules for the authenticated owner.
 */
router.get("/rules", async (req, res) => {
  try {
    const ownerId = (req as any).userId;
    const rules = await prisma.approvalRule.findMany({
      where: { ownerId },
      orderBy: { createdAt: "desc" },
    });
    res.json({ rules });
  } catch (err) {
    logger.error({ err }, "agent: failed to list rules");
    res.status(500).json({ error: "Failed to list rules" });
  }
});

/**
 * POST /agent/rules
 * Create a new approval rule.
 */
router.post("/rules", async (req, res) => {
  try {
    const ownerId = (req as any).userId;
    const { category, effect, params, note, contactId, enabled } = req.body;

    if (!category || !effect) {
      return res.status(400).json({ error: "category and effect are required" });
    }

    // Validate category
    const validCategories = ["scheduling", "money", "personal_info", "commitment", "other"];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ error: `Invalid category. Must be one of: ${validCategories.join(", ")}` });
    }

    // Validate effect
    const validEffects = ["allow", "deny", "ask", "handoff"];
    if (!validEffects.includes(effect)) {
      return res.status(400).json({ error: `Invalid effect. Must be one of: ${validEffects.join(", ")}` });
    }

    // Validate params based on category
    if (category === "scheduling" && params) {
      const validTypes = ["any", "outside_hours", "weekends", "before_hour", "after_hour"];
      if (params.type && !validTypes.includes(params.type as string)) {
        return res.status(400).json({ error: `Invalid scheduling type. Must be one of: ${validTypes.join(", ")}` });
      }
      if ((params.type === "before_hour" || params.type === "after_hour") && typeof params.hour !== "number") {
        return res.status(400).json({ error: "hour is required for before_hour and after_hour rules" });
      }
    }

    if (category === "money" && (effect === "allow" || effect === "ask") && params) {
      if (typeof params.threshold !== "number") {
        return res.status(400).json({ error: "threshold is required for money allow/ask rules" });
      }
    }

    const rule = await prisma.approvalRule.create({
      data: {
        ownerId,
        category,
        effect,
        params: params || null,
        note: note || null,
        contactId: contactId || null,
        enabled: enabled !== false,
      },
    });

    return res.json({ rule });
  } catch (err) {
    logger.error({ err }, "agent: failed to create rule");
    return res.status(500).json({ error: "Failed to create rule" });
  }
});

/**
 * PUT /agent/rules/:id
 * Update an approval rule.
 */
router.put("/rules/:id", async (req, res) => {
  try {
    const ownerId = (req as any).userId;
    const { id } = req.params;
    const { category, effect, params, note, contactId, enabled } = req.body;

    const rule = await prisma.approvalRule.updateMany({
      where: { id, ownerId },
      data: {
        ...(category && { category }),
        ...(effect && { effect }),
        ...(params !== undefined && { params }),
        ...(note !== undefined && { note }),
        ...(contactId !== undefined && { contactId }),
        ...(enabled !== undefined && { enabled }),
      },
    });

    if (rule.count === 0) {
      return res.status(404).json({ error: "Rule not found" });
    }

    const updated = await prisma.approvalRule.findUnique({ where: { id } });
    return res.json({ rule: updated });
  } catch (err) {
    logger.error({ err }, "agent: failed to update rule");
    return res.status(500).json({ error: "Failed to update rule" });
  }
});

/**
 * DELETE /agent/rules/:id
 * Delete an approval rule.
 */
router.delete("/rules/:id", async (req, res) => {
  try {
    const ownerId = (req as any).userId;
    const { id } = req.params;

    const rule = await prisma.approvalRule.deleteMany({
      where: { id, ownerId },
    });

    if (rule.count === 0) {
      return res.status(404).json({ error: "Rule not found" });
    }

    return res.json({ success: true });
  } catch (err) {
    logger.error({ err }, "agent: failed to delete rule");
    return res.status(500).json({ error: "Failed to delete rule" });
  }
});

/**
 * GET /agent/lessons
 * List all learned lessons for the authenticated owner.
 */
router.get("/lessons", async (req, res) => {
  try {
    const ownerId = (req as any).userId;
    const lessons = await prisma.promptLesson.findMany({
      where: { ownerId },
      orderBy: { createdAt: "desc" },
    });
    res.json({ lessons });
  } catch (err) {
    logger.error({ err }, "agent: failed to list lessons");
    res.status(500).json({ error: "Failed to list lessons" });
  }
});

/**
 * PUT /agent/lessons/:id
 * Update a lesson (e.g., mark as applied, disable).
 */
router.put("/lessons/:id", async (req, res) => {
  try {
    const ownerId = (req as any).userId;
    const { id } = req.params;
    const { status, appliedCount } = req.body;

    const lesson = await prisma.promptLesson.updateMany({
      where: { id, ownerId },
      data: {
        ...(status && { status }),
        ...(appliedCount !== undefined && { appliedCount }),
      },
    });

    if (lesson.count === 0) {
      return res.status(404).json({ error: "Lesson not found" });
    }

    const updated = await prisma.promptLesson.findUnique({ where: { id } });
    return res.json({ lesson: updated });
  } catch (err) {
    logger.error({ err }, "agent: failed to update lesson");
    return res.status(500).json({ error: "Failed to update lesson" });
  }
});

/**
 * GET /agent/settings
 * Get agent autonomy settings (digest mode, etc.).
 */
router.get("/settings", async (req, res) => {
  try {
    const ownerId = (req as any).userId;
    const owner = await prisma.account.findUnique({
      where: { id: ownerId },
      select: {
        digestMode: true,
        digestHour: true,
        lastDigestAt: true,
      },
    });
    res.json({ settings: owner });
  } catch (err) {
    logger.error({ err }, "agent: failed to get settings");
    res.status(500).json({ error: "Failed to get settings" });
  }
});

/**
 * PUT /agent/settings
 * Update agent autonomy settings.
 */
router.put("/settings", async (req, res) => {
  try {
    const ownerId = (req as any).userId;
    const { digestMode, digestHour } = req.body;

    const owner = await prisma.account.update({
      where: { id: ownerId },
      data: {
        ...(digestMode && { digestMode }),
        ...(digestHour !== undefined && { digestHour }),
      },
    });

    return res.json({ settings: owner });
  } catch (err) {
    logger.error({ err }, "agent: failed to update settings");
    return res.status(500).json({ error: "Failed to update settings" });
  }
});

export default router;
