import { Router, type IRouter } from "express";
import { prisma } from "@workspace/db-prisma";
import { asyncHandler } from "../lib/asyncHandler";
import { google } from "googleapis";
import { logger } from "../lib/logger";
import { signToken } from "../lib/jwt";
import { requireAuth } from "../lib/authMiddleware";
import crypto from 'crypto';

// ---------------------------------------------------------------------------
// Default contacts seeded for every new user on first sign-in
// ---------------------------------------------------------------------------

const DEFAULT_CONTACTS = [
  { name: 'Phone Agent',             business: 'Your personal assistant',       category: 'Assistant',                    initials: 'PA', color: '#ff9b83', note: 'Ready to help with everyday admin',      online: true  },
  { name: 'Bright Smile Dental',     business: 'Dentist / dental clinic',       category: 'Healthcare & Medical',         initials: 'BS', color: '#f7ad92', note: 'Ask for a late morning slot'                          },
  { name: 'Dr. Patel — Family Practice', business: 'Doctor / GP',              category: 'Healthcare & Medical',         initials: 'DP', color: '#8fc9b0', note: 'Annual physical is due'                               },
  { name: 'Riverside Auto Service',  business: 'Car service / mechanic',        category: 'Home, Auto & Local Services',  initials: 'RA', color: '#e0b568', note: 'Due for an oil change + brake check'                  },
  { name: 'Horizon Insurance',       business: 'Insurance company',             category: 'Financial, Insurance & Bills', initials: 'HI', color: '#c9a4dd', note: 'Policy renewal question'                              },
  { name: 'Meridian Bank',           business: 'Bank / credit card company',    category: 'Financial, Insurance & Bills', initials: 'MB', color: '#7fa8dd', note: 'Dispute a charge'                                      },
  { name: 'Metro DMV',               business: 'DMV / motor vehicle dept',      category: 'Government & Bureaucracy',     initials: 'MD', color: '#7fb3d5', note: 'License renewal — appointment needed'                  },
  { name: 'ConnectMobile',           business: 'Telecom / mobile provider',     category: 'Customer Service & Retail',   initials: 'CM', color: '#a8c9a8', note: 'Question about the new plan'                           },
] as const;

const CONTACT_PHONE = process.env.TEST_PHONE_NUMBER ?? '+10000000000';

async function seedDefaultContacts(userId: string): Promise<void> {
  logger.info({ userId }, "Seeding default contacts for new user");
  for (const c of DEFAULT_CONTACTS) {
    const contact = await prisma.contact.create({
      data: {
        userId,
        name:     c.name,
        business: c.business,
        category: c.category,
        phone:    CONTACT_PHONE,
        initials: c.initials,
        color:    c.color,
        note:     c.note,
        online:   'online' in c ? Boolean(c.online) : false,
      },
    });
    await prisma.conversation.create({
      data: { title: `Chat with ${c.name}`, contactId: contact.id },
    });
  }
  logger.info({ userId, count: DEFAULT_CONTACTS.length }, "Default contacts seeded");
}

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

  // Generate a random state parameter for CSRF protection
  const state = crypto.randomBytes(16).toString('hex');

  const scopes = [
    "openid",
    "email", 
    "profile",
    "https://www.googleapis.com/auth/calendar.events",
  ];

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline", // Request refresh token
    prompt: "consent",      // Force consent to ensure we get refresh token
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
// Exchange authorization code for tokens, create/update user, set JWT cookie
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

    // Upsert user by googleId
    const user = await prisma.user.upsert({
      where: { googleId: userInfo.id },
      create: {
        googleId: userInfo.id,
        email: userInfo.email,
        name: userInfo.name,
        picture: userInfo.picture,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiryDate: expiryDate,
        scope: tokens.scope || "",
      },
      update: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiryDate: expiryDate,
        scope: tokens.scope || "",
        name: userInfo.name,
        picture: userInfo.picture,
      },
    });

    // Sign JWT token
    const jwtToken = signToken({ userId: user.id, email: user.email });

    // Seed default contacts for brand-new users (no contacts yet)
    const contactCount = await prisma.contact.count({ where: { userId: user.id } });
    if (contactCount === 0) {
      void seedDefaultContacts(user.id).catch((err) =>
        logger.error({ err }, "Failed to seed default contacts for new user"),
      );
    }

    // Set httpOnly cookie
    res.cookie('token', jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    logger.info(`User authenticated: ${user.email}`);

    // Redirect to frontend
    res.redirect("/");
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
// Return current user or 401
// ---------------------------------------------------------------------------
router.get("/auth/me", requireAuth, asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId! },
    select: {
      id: true,
      googleId: true,
      email: true,
      name: true,
      picture: true,
      createdAt: true,
    },
  });

  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }

  res.json(user);
}, "Failed to get current user"));

// ---------------------------------------------------------------------------
// GET /auth/google/status
// Returns whether the current user has a connected Google Calendar.
// Used by CalendarSection to decide whether to show Connect or Sync button.
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

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { accessToken: true, refreshToken: true, expiryDate: true },
  });

  if (!user || !user.accessToken) {
    res.json({ connected: false, hasAuth: false, expired: false });
    return;
  }

  const expired = user.expiryDate < new Date();
  const canRefresh = Boolean(user.refreshToken);

  res.json({
    connected: canRefresh || !expired,
    hasAuth: true,
    expired: expired && !canRefresh,
  });
}, "Failed to get Google auth status"));

// ---------------------------------------------------------------------------
// DELETE /auth/google
// Clears the user's stored Google Calendar tokens (disconnect calendar).
// Does NOT log the user out — they keep their session cookie.
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

  await prisma.user.update({
    where: { id: payload.userId },
    data: {
      accessToken: "",
      refreshToken: "",
      syncToken: null,
    },
  });

  res.json({ success: true });
}, "Failed to disconnect Google Calendar"));

export default router;
