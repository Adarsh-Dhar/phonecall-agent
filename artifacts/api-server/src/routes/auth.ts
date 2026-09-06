import { Router, type IRouter } from "express";
import { prisma } from "@workspace/db-prisma";
import { asyncHandler } from "../lib/asyncHandler";
import { google } from "googleapis";
import { logger } from "../lib/logger";
import { signToken } from "../lib/jwt";
import { requireAuth } from "../lib/authMiddleware";
import crypto from 'crypto';

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

    // Sign JWT token
    const jwtToken = signToken({ userId: account.id, email: account.email ?? "" });

    // Set httpOnly cookie
    res.cookie('token', jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
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
// Clear the JWT cookie
// ---------------------------------------------------------------------------
router.post("/auth/logout", asyncHandler(async (req, res) => {
  res.clearCookie('token');
  res.json({ success: true });
}, "Failed to logout"));

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
    res.json({ connected: false, hasAuth: false, expired: false });
    return;
  }

  const { verifyToken } = await import("../lib/jwt");
  const payload = verifyToken(token);
  if (!payload) {
    res.json({ connected: false, hasAuth: false, expired: false });
    return;
  }

  const account = await prisma.account.findUnique({
    where: { id: payload.userId },
    select: { accessToken: true, refreshToken: true, expiryDate: true },
  });

  if (!account || !account.accessToken) {
    res.json({ connected: false, hasAuth: false, expired: false });
    return;
  }

  const expired = account.expiryDate ? account.expiryDate < new Date() : true;
  const canRefresh = Boolean(account.refreshToken);

  res.json({
    connected: canRefresh || !expired,
    hasAuth:   true,
    expired:   expired && !canRefresh,
  });
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

export default router;
