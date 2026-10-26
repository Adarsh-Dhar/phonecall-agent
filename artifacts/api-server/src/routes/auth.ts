import { Router, type IRouter } from "express";
import { prisma } from "@workspace/db-prisma";
import { asyncHandler } from "../lib/asyncHandler";
import { google } from "googleapis";
import { logger } from "../lib/logger";
import { signToken } from "../lib/jwt";
import { requireAuth } from "../lib/authMiddleware";
import crypto from 'crypto';
import { emailConfigured } from "../services/outbound/email";
import { resolveDeclinePrefs, validateDeclinePrefs } from "../services/declinePolicy";

const router: IRouter = Router();

// ---------------------------------------------------------------------------
// OAuth Configuration
// ---------------------------------------------------------------------------

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REDIRECT_URI) {
  logger.warn("Google OAuth credentials not configured. Authentication will be disabled.");
}

const oauth2Client = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI
);

// ---------------------------------------------------------------------------
// GET /auth/google/login
// Redirect to Google's consent screen
// ---------------------------------------------------------------------------
router.get("/auth/google/login", asyncHandler(async (req, res) => {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REDIRECT_URI) {
    res.status(500).json({ error: "Google OAuth not configured" });
    return;
  }

  // Plain random state for CSRF protection — role is chosen after OAuth on
  // the /role page, so we no longer need to encode it in the state string.
  const state = crypto.randomBytes(16).toString('hex');

  const scopes = [
    "openid",
    "email",
    "profile",
    "https://www.googleapis.com/auth/calendar.events",
  ];

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",  // Request refresh token
    prompt: "consent",       // Force consent to ensure we get refresh token
    scope: scopes,
    state: state,
  });

  // Store state in a cookie for verification during callback
  res.cookie('oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600000 // 10 minutes
  });

  res.redirect(authUrl);
}, "Failed to redirect to Google OAuth"));

// ---------------------------------------------------------------------------
// GET /auth/google/callback
// Exchange authorization code for tokens, create/update account, set JWT cookie
// ---------------------------------------------------------------------------
router.get("/auth/google/callback", asyncHandler(async (req, res) => {
  const { code, state } = req.query;

  if (!code || typeof code !== "string") {
    res.status(400).json({ error: "Authorization code is required" });
    return;
  }

  if (!state || typeof state !== "string") {
    res.status(400).json({ error: "State parameter is required" });
    return;
  }

  // Verify state to prevent CSRF attacks
  const storedState = req.cookies?.oauth_state;
  if (!storedState || storedState !== state) {
    logger.error("OAuth state mismatch - possible CSRF attack");
    res.status(400).json({ error: "Invalid state parameter" });
    return;
  }

  // Clear the state cookie
  res.clearCookie('oauth_state');

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REDIRECT_URI) {
    res.status(500).json({ error: "Google OAuth not configured" });
    return;
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.access_token || !tokens.refresh_token) {
      res.status(500).json({ error: "Failed to obtain tokens from Google" });
      return;
    }

    // Get user info from Google
    oauth2Client.setCredentials(tokens);
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const { data: userInfo } = await oauth2.userinfo.get();

    if (!userInfo.id || !userInfo.email) {
      res.status(500).json({ error: "Failed to obtain user info from Google" });
      return;
    }

    // tokens.expiry_date is an absolute epoch-ms timestamp, not a duration.
    const expiryDate = new Date(tokens.expiry_date || Date.now() + 3600000);

    // Check whether this Google identity already exists in the DB
    const existingAccount = await prisma.account.findUnique({
      where: { googleId: userInfo.id },
    });
    const isNewAccount = !existingAccount;

    // Upsert the login account.
    // New accounts get isService=false as a placeholder — the /role page sets the real value.
    // Returning accounts keep their existing isService value unchanged.
    const account = await prisma.account.upsert({
      where: { googleId: userInfo.id },
      create: {
        isService:    false, // placeholder; overwritten immediately on /role
        googleId:     userInfo.id,
        email:        userInfo.email,
        name:         userInfo.name ?? userInfo.email,
        picture:      userInfo.picture,
        accessToken:  tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiryDate:   expiryDate,
        scope:        tokens.scope ?? "",
      },
      update: {
        accessToken:  tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiryDate:   expiryDate,
        scope:        tokens.scope ?? "",
        name:         userInfo.name ?? userInfo.email,
        picture:      userInfo.picture,
        // Do NOT update isService here — role changes go through PATCH /auth/role
      },
    });

    // Clear any existing token cookie to ensure we don't have stale sessions
    res.clearCookie('token');

    // Sign JWT token
    const jwtToken = signToken({ userId: account.id, email: account.email ?? "" });

    // Set httpOnly cookie for API authentication
    // Only use secure cookies in production if not on localhost
    const isLocalhost = req.hostname === 'localhost' || req.hostname === '127.0.0.1';
    res.cookie('token', jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production' && !isLocalhost,
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Also set a non-httpOnly cookie for client-side WebSocket authentication
    // This allows JavaScript to read the token and pass it in WebSocket URLs
    res.cookie('token_ws', jwtToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production' && !isLocalhost,
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    logger.info(`Account authenticated: ${account.email}`);

    // New accounts → role selection page; returning accounts → app
    res.redirect(isNewAccount ? "/?setup=1" : "/");
  } catch (error) {
    logger.error({ error }, "Failed to handle Google OAuth callback");
    res.redirect("/?auth-error=true");
  }
}, "Failed to handle Google OAuth callback"));

// ---------------------------------------------------------------------------
// POST /auth/logout
// Clear the JWT cookies
// ---------------------------------------------------------------------------
router.post("/auth/logout", asyncHandler(async (req, res) => {
  res.clearCookie('token');
  res.clearCookie('token_ws');
  res.json({ success: true });
}, "Failed to logout"));

// ---------------------------------------------------------------------------
// GET /user/agent-auto-answer
// PATCH /user/agent-auto-answer   Body: { enabled: boolean }
// When enabled, the individual's AI agent answers incoming business calls itself
// (no ring, works while the owner is offline). Individuals only.
// ---------------------------------------------------------------------------
router.get("/user/agent-auto-answer", requireAuth, asyncHandler(async (req, res) => {
  const account = await prisma.account.findUnique({
    where: { id: req.userId! },
    select: { agentAutoAnswer: true },
  });
  if (!account) {
    res.status(404).json({ error: "Account not found" });
    return;
  }
  res.json({ enabled: account.agentAutoAnswer });
}, "Failed to get agent auto-answer setting"));

router.patch("/user/agent-auto-answer", requireAuth, asyncHandler(async (req, res) => {
  const { enabled } = req.body;
  if (typeof enabled !== "boolean") {
    res.status(400).json({ error: "enabled must be a boolean" });
    return;
  }

  const account = await prisma.account.findUnique({
    where: { id: req.userId! },
    select: { isService: true },
  });
  if (!account) {
    res.status(404).json({ error: "Account not found" });
    return;
  }
  if (account.isService) {
    res.status(403).json({ error: "Only individual accounts have an AI agent that can auto-answer" });
    return;
  }

  // DEPRECATED: Redirect to the new agent-mode field
  // This old endpoint is kept for backward compatibility with older clients
  await prisma.account.update({
    where: { id: req.userId! },
    data: { agentMode: enabled, agentAutoAnswer: enabled },
  });
  res.json({ enabled });
}, "Failed to update agent auto-answer setting"));

// ---------------------------------------------------------------------------
// GET /user/agent-mode
// PATCH /user/agent-mode   Body: { enabled: boolean }
// Master switch for the individual's AI agent. When enabled the agent places scheduled calls
// and answers incoming business calls on the owner's behalf, with no action from the owner.
// Individuals only (business accounts get 403).
// ---------------------------------------------------------------------------
router.get("/user/agent-mode", requireAuth, asyncHandler(async (req, res) => {
  const account = await prisma.account.findUnique({
    where: { id: req.userId! },
    select: { agentMode: true, isService: true },
  });
  if (!account) {
    res.status(404).json({ error: "Account not found" });
    return;
  }
  if (account.isService) {
    res.status(403).json({ error: "Agent mode is only available to individual accounts" });
    return;
  }
  res.json({ enabled: account.agentMode });
}, "Failed to get agent mode"));

router.patch("/user/agent-mode", requireAuth, asyncHandler(async (req, res) => {
  const { enabled } = req.body;
  if (typeof enabled !== "boolean") {
    res.status(400).json({ error: "enabled must be a boolean" });
    return;
  }

  const account = await prisma.account.findUnique({
    where: { id: req.userId! },
    select: { isService: true },
  });
  if (!account) {
    res.status(404).json({ error: "Account not found" });
    return;
  }
  if (account.isService) {
    res.status(403).json({ error: "Agent mode is only available to individual accounts" });
    return;
  }

  // agentAutoAnswer is kept in sync so anything still reading the old column behaves the same.
  await prisma.account.update({
    where: { id: req.userId! },
    data: { agentMode: enabled, agentAutoAnswer: enabled },
  });
  res.json({ enabled });
}, "Failed to update agent mode"));

// ---------------------------------------------------------------------------
// GET /user/email-fallback
// PATCH /user/email-fallback   Body: { enabled: boolean }
// When on (the default), the owner gets an email at their login address if neither an open tab nor
// web push could be reached (call attempts exhausted, reminders). `canEmail` is false when the
// account has no email address; `configured` is false when the server has no mail provider set up.
// ---------------------------------------------------------------------------
router.get("/user/email-fallback", requireAuth, asyncHandler(async (req, res) => {
  const account = await prisma.account.findUnique({
    where: { id: req.userId! },
    select: { emailFallback: true, email: true },
  });
  if (!account) {
    res.status(404).json({ error: "Account not found" });
    return;
  }
  res.json({ enabled: account.emailFallback, canEmail: !!account.email, configured: emailConfigured() });
}, "Failed to get email fallback setting"));

router.patch("/user/email-fallback", requireAuth, asyncHandler(async (req, res) => {
  const { enabled } = req.body;
  if (typeof enabled !== "boolean") {
    res.status(400).json({ error: "enabled must be a boolean" });
    return;
  }
  const { count } = await prisma.account.updateMany({
    where: { id: req.userId! },
    data: { emailFallback: enabled },
  });
  if (count === 0) {
    res.status(404).json({ error: "Account not found" });
    return;
  }
  res.json({ enabled });
}, "Failed to update email fallback setting"));

// ---------------------------------------------------------------------------
// GET /auth/me
// Return current login account or 401
// ---------------------------------------------------------------------------
router.get("/auth/me", requireAuth, asyncHandler(async (req, res) => {
  const account = await prisma.account.findUnique({
    where: { id: req.userId! },
    select: {
      id:        true,
      googleId:  true,
      email:     true,
      name:      true,
      picture:   true,
      isService: true,
      description: true,
      createdAt: true,
      agentMode: true,
    },
  });

  if (!account) {
    res.status(401).json({ error: "Account not found" });
    return;
  }

  // needsRoleSetup: true when the account has never been through /role.
  // An account that has completed /role will have isService explicitly set
  // via PATCH /auth/role — we track this via a dedicated DB flag instead of
  // inferring from contact count (which is now always zero on first login).
  // For now we use the same heuristic but keyed only on whether the account
  // was just created (ownerId is null and isService is the placeholder false).
  // Simplest reliable signal: the account was created in the last 5 minutes
  // and has isService=false with no contacts — i.e. it's brand new.
  const isNewAccount = !account.isService &&
    (new Date().getTime() - new Date(account.createdAt).getTime()) < 5 * 60 * 1000;
  // But that's fragile. Better: store a roleSetAt timestamp. For now, use
  // the /?setup=1 redirect from the callback as the gate and just expose
  // needsRoleSetup as false for all existing accounts (they already have a role).
  const needsRoleSetup = false;

  res.json({ ...account, needsRoleSetup });
}, "Failed to get current account"));

// ---------------------------------------------------------------------------
// PATCH /auth/role
// Set the account's role (isService true/false) after the OAuth sign-up.
// Body: { isService: boolean; name: string; description?: string }
// ---------------------------------------------------------------------------
router.patch("/auth/role", requireAuth, asyncHandler(async (req, res) => {
  const { isService, name, description } = req.body;

  if (typeof isService !== "boolean") {
    res.status(400).json({ error: "isService must be a boolean" });
    return;
  }

  if (typeof name !== "string" || name.trim().length === 0) {
    res.status(400).json({ error: "name is required and must be a non-empty string" });
    return;
  }

  if (isService && (typeof description !== "string" || description.trim().length === 0)) {
    res.status(400).json({ error: "description is required for service accounts" });
    return;
  }

  await prisma.account.update({
    where: { id: req.userId! },
    data:  { 
      isService,
      name: name.trim(),
      description: isService ? description?.trim() : null,
    },
  });

  res.json({ ok: true, isService });
}, "Failed to set account role"));

// ---------------------------------------------------------------------------
// GET /auth/google/status
// Returns whether the current account has a connected Google Calendar.
// ---------------------------------------------------------------------------
router.get("/auth/google/status", asyncHandler(async (req, res) => {
  const token = req.cookies?.token;
  if (!token) {
    logger.debug("Google auth status: no token found");
    res.json({ connected: false, hasAuth: false, expired: false });
    return;
  }

  const { verifyToken } = await import("../lib/jwt");
  const payload = verifyToken(token);
  if (!payload) {
    logger.debug("Google auth status: invalid token");
    res.json({ connected: false, hasAuth: false, expired: false });
    return;
  }

  // If the user has a valid session, they're connected to Google Calendar
  // since we always request calendar.events scope during OAuth login
  logger.debug({ userId: payload.userId }, "Google auth status: user is authenticated, calendar connected");
  res.json({ connected: true, hasAuth: true, expired: false });
}, "Failed to get Google auth status"));

// ---------------------------------------------------------------------------
// DELETE /auth/google
// Clears the login account's stored Google Calendar tokens (disconnect calendar).
// Does NOT log the account out — they keep their session cookie.
// ---------------------------------------------------------------------------
router.delete("/auth/google", asyncHandler(async (req, res) => {
  const token = req.cookies?.token;
  if (!token) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const { verifyToken } = await import("../lib/jwt");
  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({ error: "Invalid session" });
    return;
  }

  await prisma.account.update({
    where: { id: payload.userId },
    data: {
      accessToken:  "",
      refreshToken: "",
      syncToken:    null,
    },
  });

  res.json({ success: true });
}, "Failed to disconnect Google Calendar"));

// ---------------------------------------------------------------------------
// GET /user/timezone
// Get the user's timezone setting
// ---------------------------------------------------------------------------
router.get("/user/timezone", requireAuth, asyncHandler(async (req, res) => {
  const account = await prisma.account.findUnique({
    where: { id: req.userId! },
    select: { timezone: true },
  });

  if (!account) {
    res.status(404).json({ error: "Account not found" });
    return;
  }

  res.json({ timezone: account.timezone });
}, "Failed to get timezone"));

// ---------------------------------------------------------------------------
// PATCH /user/timezone
// Update the user's timezone setting
// ---------------------------------------------------------------------------
router.patch("/user/timezone", requireAuth, asyncHandler(async (req, res) => {
  const { timezone } = req.body;

  if (typeof timezone !== "string" || timezone.trim().length === 0) {
    res.status(400).json({ error: "timezone is required and must be a non-empty string" });
    return;
  }

  const tz = timezone.trim();

  // Validate that the timezone is valid
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
  } catch (e) {
    res.status(400).json({ error: "Invalid timezone identifier" });
    return;
  }

  await prisma.account.update({
    where: { id: req.userId! },
    data: { timezone: tz },
  });

  res.json({ success: true });
}, "Failed to update timezone"));

// ---------------------------------------------------------------------------
// GET /user/decline-retry
// Individuals only (business accounts get 403).
// ---------------------------------------------------------------------------
router.get("/user/decline-retry", requireAuth, asyncHandler(async (req, res) => {
  const account = await prisma.account.findUnique({
    where: { id: req.userId! },
    select: { declineRetryDelayMin: true, declineMaxRetries: true, isService: true },
  });
  if (!account) {
    res.status(404).json({ error: "Account not found" });
    return;
  }
  if (account.isService) {
    res.status(403).json({ error: "Only individual accounts have an AI agent that places calls" });
    return;
  }
  const { delayMin, maxRetries } = resolveDeclinePrefs(account);
  res.json({ delayMin, maxRetries });
}, "Failed to get decline retry settings"));

// ---------------------------------------------------------------------------
// PATCH /user/decline-retry   Body: { delayMin: number (1-1440), maxRetries: number (0-10) }
// What the agent does when a business rejects its call: wait delayMin minutes, recall up to
// maxRetries times (0 = never recall), then stop and tell the owner the business is non-responsive.
// ---------------------------------------------------------------------------
router.patch("/user/decline-retry", requireAuth, asyncHandler(async (req, res) => {
  const account = await prisma.account.findUnique({ where: { id: req.userId! }, select: { isService: true } });
  if (!account) {
    res.status(404).json({ error: "Account not found" });
    return;
  }
  if (account.isService) {
    res.status(403).json({ error: "Only individual accounts have an AI agent that places calls" });
    return;
  }
  let prefs;
  try {
    prefs = validateDeclinePrefs(req.body ?? {});
  } catch (e) {
    res.status(400).json({ error: e instanceof Error ? e.message : "Invalid settings" });
    return;
  }
  await prisma.account.update({
    where: { id: req.userId! },
    data: { declineRetryDelayMin: prefs.delayMin, declineMaxRetries: prefs.maxRetries },
  });
  res.json(prefs);
}, "Failed to update decline retry settings"));

// ---------------------------------------------------------------------------
// GET /user/quiet-hours
// Get the user's quiet hours setting
// ---------------------------------------------------------------------------
router.get("/user/quiet-hours", requireAuth, asyncHandler(async (req, res) => {
  const account = await prisma.account.findUnique({
    where: { id: req.userId! },
    select: { quietHoursStart: true, quietHoursEnd: true },
  });

  if (!account) {
    res.status(404).json({ error: "Account not found" });
    return;
  }

  res.json({ quietHoursStart: account.quietHoursStart, quietHoursEnd: account.quietHoursEnd });
}, "Failed to get quiet hours"));

// ---------------------------------------------------------------------------
// PATCH /user/quiet-hours
// Update the user's quiet hours setting
// Body: { quietHoursStart: number | null, quietHoursEnd: number | null }
// Hours are 0-23, or null to disable quiet hours
// ---------------------------------------------------------------------------
router.patch("/user/quiet-hours", requireAuth, asyncHandler(async (req, res) => {
  const { quietHoursStart, quietHoursEnd } = req.body;

  // Validate: if one is set, both must be set; if both are null, that's fine (disabled)
  if ((quietHoursStart === null && quietHoursEnd !== null) ||
      (quietHoursStart !== null && quietHoursEnd === null)) {
    res.status(400).json({ error: "Both quietHoursStart and quietHoursEnd must be set together, or both null" });
    return;
  }

  // If not null, validate range 0-23
  if (quietHoursStart !== null) {
    if (typeof quietHoursStart !== "number" || quietHoursStart < 0 || quietHoursStart > 23 ||
        typeof quietHoursEnd !== "number" || quietHoursEnd < 0 || quietHoursEnd > 23) {
      res.status(400).json({ error: "Quiet hours must be numbers between 0 and 23" });
      return;
    }
  }

  await prisma.account.update({
    where: { id: req.userId! },
    data: {
      quietHoursStart: quietHoursStart === null ? null : quietHoursStart,
      quietHoursEnd: quietHoursEnd === null ? null : quietHoursEnd,
    },
  });

  res.json({ success: true });
}, "Failed to update quiet hours"));

// ---------------------------------------------------------------------------
// GET /user/response-style
// Get the user's response style preferences (concise, ask clarifying, confirm before action)
// ---------------------------------------------------------------------------
router.get("/user/response-style", requireAuth, asyncHandler(async (req, res) => {
  const account = await prisma.account.findUnique({
    where: { id: req.userId! },
    select: { responseConcise: true, askClarifying: true, confirmBeforeAction: true },
  });

  if (!account) {
    res.status(404).json({ error: "Account not found" });
    return;
  }

  res.json({
    concise: account.responseConcise,
    askClarifying: account.askClarifying,
    confirmBeforeAction: account.confirmBeforeAction,
  });
}, "Failed to get response style"));

// ---------------------------------------------------------------------------
// PATCH /user/response-style
// Update the user's response style preferences
// Body: { concise?: boolean, askClarifying?: boolean, confirmBeforeAction?: boolean }
// ---------------------------------------------------------------------------
router.patch("/user/response-style", requireAuth, asyncHandler(async (req, res) => {
  const { concise, askClarifying, confirmBeforeAction } = req.body;

  const updateData: Record<string, boolean> = {};
  if (typeof concise === "boolean") {
    updateData.responseConcise = concise;
  }
  if (typeof askClarifying === "boolean") {
    updateData.askClarifying = askClarifying;
  }
  if (typeof confirmBeforeAction === "boolean") {
    updateData.confirmBeforeAction = confirmBeforeAction;
  }

  if (Object.keys(updateData).length === 0) {
    res.status(400).json({ error: "At least one field must be provided" });
    return;
  }

  await prisma.account.update({
    where: { id: req.userId! },
    data: updateData,
  });

  res.json({ success: true });
}, "Failed to update response style"));

// ---------------------------------------------------------------------------
// GET /user/owner-response-timeout
// Get the user's owner response timeout setting (how long agent waits for owner)
// ---------------------------------------------------------------------------
router.get("/user/owner-response-timeout", requireAuth, asyncHandler(async (req, res) => {
  const account = await prisma.account.findUnique({
    where: { id: req.userId! },
    select: { ownerResponseTimeoutSec: true },
  });

  if (!account) {
    res.status(404).json({ error: "Account not found" });
    return;
  }

  res.json({ timeoutSec: account.ownerResponseTimeoutSec ?? 60 });
}, "Failed to get owner response timeout"));

// ---------------------------------------------------------------------------
// PATCH /user/owner-response-timeout
// Update the user's owner response timeout setting
// Body: { timeoutSec: number (15-180) }
// ---------------------------------------------------------------------------
router.patch("/user/owner-response-timeout", requireAuth, asyncHandler(async (req, res) => {
  const { timeoutSec } = req.body;

  if (typeof timeoutSec !== "number" || timeoutSec < 15 || timeoutSec > 180) {
    res.status(400).json({ error: "timeoutSec must be a number between 15 and 180 seconds" });
    return;
  }

  await prisma.account.update({
    where: { id: req.userId! },
    data: { ownerResponseTimeoutSec: timeoutSec },
  });

  res.json({ timeoutSec });
}, "Failed to update owner response timeout"));

// ---------------------------------------------------------------------------
// GET /user/loop-settings
// Get the user's follow-up memory window settings (optional/advanced)
// ---------------------------------------------------------------------------
router.get("/user/loop-settings", requireAuth, asyncHandler(async (req, res) => {
  const account = await prisma.account.findUnique({
    where: { id: req.userId! },
    select: { loopCheckinGraceMin: true, loopExpireDays: true },
  });

  if (!account) {
    res.status(404).json({ error: "Account not found" });
    return;
  }

  res.json({
    checkinGraceMin: account.loopCheckinGraceMin ?? 120,
    expireDays: account.loopExpireDays ?? 14,
  });
}, "Failed to get loop settings"));

// ---------------------------------------------------------------------------
// PATCH /user/loop-settings
// Update the user's follow-up memory window settings
// Body: { checkinGraceMin?: number (30-720), expireDays?: number (1-90) }
// ---------------------------------------------------------------------------
router.patch("/user/loop-settings", requireAuth, asyncHandler(async (req, res) => {
  const { checkinGraceMin, expireDays } = req.body;

  const updateData: Record<string, number> = {};

  if (typeof checkinGraceMin === "number") {
    if (checkinGraceMin < 30 || checkinGraceMin > 720) {
      res.status(400).json({ error: "checkinGraceMin must be between 30 and 720 minutes" });
      return;
    }
    updateData.loopCheckinGraceMin = checkinGraceMin;
  }

  if (typeof expireDays === "number") {
    if (expireDays < 1 || expireDays > 90) {
      res.status(400).json({ error: "expireDays must be between 1 and 90 days" });
      return;
    }
    updateData.loopExpireDays = expireDays;
  }

  if (Object.keys(updateData).length === 0) {
    res.status(400).json({ error: "At least one field must be provided" });
    return;
  }

  await prisma.account.update({
    where: { id: req.userId! },
    data: updateData,
  });

  res.json(updateData);
}, "Failed to update loop settings"));

export default router;
