import { Router, type IRouter } from "express";
import { prisma } from "@workspace/db-prisma";
import { asyncHandler } from "../lib/asyncHandler";
import { google } from "googleapis";
import { logger } from "../lib/logger";
import { manualSync } from "../services/calendarSync";

const router: IRouter = Router();

// ---------------------------------------------------------------------------
// OAuth Configuration
// ---------------------------------------------------------------------------

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REDIRECT_URI) {
  logger.warn("Google OAuth credentials not configured. Calendar integration will be disabled.");
}

const oauth2Client = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI
);

// ---------------------------------------------------------------------------
// GET /auth/google
// Redirect to Google's consent screen
// ---------------------------------------------------------------------------
router.get("/auth/google", asyncHandler(async (req, res) => {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REDIRECT_URI) {
    res.status(500).json({ error: "Google OAuth not configured" });
    return;
  }

  const scopes = [
    "https://www.googleapis.com/auth/calendar.events",
  ];

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline", // Request refresh token
    prompt: "consent",      // Force consent to ensure we get refresh token
    scope: scopes,
  });

  res.redirect(authUrl);
}, "Failed to redirect to Google OAuth"));

// ---------------------------------------------------------------------------
// GET /auth/google/callback
// Exchange authorization code for tokens and store in database
// ---------------------------------------------------------------------------
router.get("/auth/google/callback", asyncHandler(async (req, res) => {
  const { code } = req.query;

  if (!code || typeof code !== "string") {
    res.status(400).json({ error: "Authorization code is required" });
    return;
  }

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

    // Calculate expiry date (tokens expire in 1 hour by default)
    const expiryDate = new Date(Date.now() + (tokens.expiry_date || 3600000));

    // Upsert the single GoogleAuth row
    await prisma.googleAuth.upsert({
      where: { id: "default" },
      create: {
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
      },
    });

    logger.info("Google Calendar connected successfully");

    // Redirect to frontend with success message
    res.redirect("/?calendar-connected=true");
  } catch (error) {
    logger.error({ error }, "Failed to exchange Google OAuth code for tokens");
    res.redirect("/?calendar-error=true");
  }
}, "Failed to handle Google OAuth callback"));

// ---------------------------------------------------------------------------
// GET /auth/google/status
// Check if Google Calendar is connected
// ---------------------------------------------------------------------------
router.get("/auth/google/status", asyncHandler(async (req, res) => {
  try {
    const auth = await prisma.googleAuth.findUnique({
      where: { id: "default" },
    });

    const isConnected = !!auth && auth.expiryDate > new Date();

    res.json({
      connected: isConnected,
      hasAuth: !!auth,
      expired: auth ? auth.expiryDate < new Date() : false,
    });
  } catch (error) {
    logger.error({ error }, "Failed to check Google auth status");
    res.status(500).json({ error: "Failed to check auth status" });
  }
}, "Failed to check Google auth status"));

// ---------------------------------------------------------------------------
// POST /calendar/sync
// Manually trigger calendar sync
// ---------------------------------------------------------------------------
router.post("/calendar/sync", asyncHandler(async (req, res) => {
  try {
    const result = await manualSync();
    res.json(result);
  } catch (error) {
    logger.error({ error }, "Failed to trigger manual calendar sync");
    res.status(500).json({ error: "Failed to trigger sync" });
  }
}, "Failed to trigger manual calendar sync"));

// ---------------------------------------------------------------------------
// DELETE /auth/google
// Disconnect Google Calendar
// ---------------------------------------------------------------------------
router.delete("/auth/google", asyncHandler(async (req, res) => {
  try {
    await prisma.googleAuth.delete({
      where: { id: "default" },
    });
    
    // Clear Google event IDs from all tasks
    await prisma.task.updateMany({
      data: {
        googleEventId: null,
        googleEtag: null,
        lastSyncedAt: null,
      },
    });

    logger.info("Google Calendar disconnected");
    res.json({ success: true });
  } catch (error) {
    logger.error({ error }, "Failed to disconnect Google Calendar");
    res.status(500).json({ error: "Failed to disconnect" });
  }
}, "Failed to disconnect Google Calendar"));

export default router;