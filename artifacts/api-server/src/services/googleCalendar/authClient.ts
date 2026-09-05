/**
 * Google OAuth Client Management
 *
 * Loads stored tokens from User model, refreshes them when expired, and persists refreshed
 * tokens back to the database. Everything else in the googleCalendar service
 * depends on one of these two functions to get an authenticated client.
 */

import { prisma } from "@workspace/db-prisma";
import { google } from "googleapis";
import { logger } from "../../lib/logger";
import {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI,
} from "./config";

/**
 * Get an authenticated OAuth2 client with auto-refresh capabilities for a specific user.
 * Loads tokens from database, refreshes if expired, and persists new tokens.
 */
export async function getAuthedClient(userId: string): Promise<google.auth.OAuth2 | null> {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REDIRECT_URI) {
    logger.warn("Google OAuth credentials not configured");
    return null;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      logger.debug(`No user found with id: ${userId}`);
      return null;
    }

    // If no refresh token, nothing we can do — skip silently
    if (!user.refreshToken) {
      logger.debug(`No refresh token for user ${userId}, skipping calendar auth`);
      return null;
    }

    const oauth2Client = new google.auth.OAuth2(
      GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET,
      GOOGLE_REDIRECT_URI
    );

    oauth2Client.setCredentials({
      access_token: user.accessToken,
      refresh_token: user.refreshToken,
      expiry_date: user.expiryDate.getTime(),
    });

    // Set up token refresh handler
    oauth2Client.on("tokens", async (tokens) => {
      try {
        logger.info("Google OAuth tokens refreshed, persisting to database");

        // tokens.expiry_date is an absolute epoch-ms timestamp, not a duration.
        const newExpiryDate = new Date(tokens.expiry_date || Date.now() + 3600000);

        await prisma.user.update({
          where: { id: userId },
          data: {
            accessToken: tokens.access_token || user.accessToken,
            expiryDate: newExpiryDate,
          },
        });
      } catch (error) {
        logger.error({ error }, "Failed to persist refreshed Google OAuth tokens");
      }
    });

    // Check if token is expired and refresh if needed
    if (user.expiryDate < new Date()) {
      logger.info("Google OAuth token expired, attempting refresh");
      try {
        const { credentials } = await oauth2Client.refreshAccessToken();
        logger.info("Google OAuth token refreshed successfully");
      } catch (error) {
        logger.error({ error }, "Failed to refresh Google OAuth token");
        return null;
      }
    }

    return oauth2Client;
  } catch (error) {
    logger.error({ error }, "Failed to get authenticated Google client");
    return null;
  }
}

/**
 * Like getAuthedClient(), but distinguishes *why* no client is available so
 * callers (routes) can return the right HTTP status: 404 when Calendar was
 * never connected, 401 when the stored token is there but refresh failed.
 */
export type AuthedClientResult =
  | { ok: true; client: google.auth.OAuth2 }
  | { ok: false; reason: "not_connected" }
  | { ok: false; reason: "refresh_failed" };

export async function getAuthedClientOrReason(userId: string): Promise<AuthedClientResult> {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REDIRECT_URI) {
    return { ok: false, reason: "not_connected" };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    logger.warn("Google Calendar not connected - no user found");
    return { ok: false, reason: "not_connected" };
  }

  if (!user.refreshToken) {
    logger.debug("Google Calendar not connected - no refresh token stored");
    return { ok: false, reason: "not_connected" };
  }

  const oauth2Client = new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI
  );

  oauth2Client.setCredentials({
    access_token: user.accessToken,
    refresh_token: user.refreshToken,
    expiry_date: user.expiryDate.getTime(),
  });

  // Check if token is expired and refresh if needed
  if (user.expiryDate < new Date()) {
    logger.info("Token expired, refreshing...");
    try {
      const { credentials } = await oauth2Client.refreshAccessToken();
      logger.info("Google OAuth token refreshed successfully");

      // credentials.expiry_date is an absolute epoch-ms timestamp, not a duration.
      const newExpiryDate = new Date(credentials.expiry_date || Date.now() + 3600000);

      await prisma.user.update({
        where: { id: userId },
        data: {
          accessToken: credentials.access_token || user.accessToken,
          expiryDate: newExpiryDate,
        },
      });

      // Update the client with the new token
      oauth2Client.setCredentials({
        access_token: credentials.access_token || user.accessToken,
        refresh_token: user.refreshToken,
        expiry_date: newExpiryDate.getTime(),
      });
    } catch (error) {
      logger.error({ error }, "Failed to refresh Google OAuth token");
      return { ok: false, reason: "refresh_failed" };
    }
  }

  return { ok: true, client: oauth2Client };
}
