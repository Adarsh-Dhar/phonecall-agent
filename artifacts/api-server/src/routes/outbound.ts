import { Router, type IRouter } from "express";
import { prisma } from "@workspace/db-prisma";
import { asyncHandler } from "../lib/asyncHandler";
import { logger } from "../lib/logger";
import { verifyOptOutToken, signOptOutToken } from "../services/outbound/optOut";

/**
 * PUBLIC (mounted before requireAuth): reached from links in messages sent to businesses.
 *
 *   GET  /outbound/opt-out?t=<token>  -> confirmation page with a button. GET never changes anything,
 *                                        because mail scanners prefetch links.
 *   POST /outbound/opt-out?t=<token>  -> performs the opt-out. This is also the target of the
 *                                        RFC 8058 one-click header (List-Unsubscribe-Post).
 */
const router: IRouter = Router();

const page = (title: string, body: string) =>
  `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">` +
  `<title>${title}</title><style>body{font:16px/1.5 system-ui,sans-serif;max-width:32rem;margin:4rem auto;padding:0 1rem;color:#1a1a1a}` +
  `button{font:inherit;padding:.6rem 1.2rem;border:0;border-radius:.5rem;background:#2854cc;color:#fff;cursor:pointer}</style></head>` +
  `<body><h1>${title}</h1>${body}</body></html>`;

function send(res: import("express").Response, status: number, html: string) {
  res.status(status).set({ "Cache-Control": "no-store", "X-Frame-Options": "DENY", "Content-Type": "text/html; charset=utf-8" }).send(html);
}

router.get("/outbound/opt-out", (req, res) => {
  const contactId = verifyOptOutToken(req.query.t);
  const token = contactId ? signOptOutToken(contactId) : null;
  if (!token) {
    send(res, 400, page("Link not valid", "<p>This opt-out link is invalid or incomplete.</p>"));
    return;
  }
  // `token` is re-derived from the verified contact id (URL-safe characters only), never echoed from the request.
  send(
    res,
    200,
    page(
      "Stop these messages?",
      `<p>You will no longer receive automated messages sent on behalf of this customer.</p>` +
        `<form method="post" action="/api/outbound/opt-out?t=${token}"><button type="submit">Stop messages</button></form>`,
    ),
  );
});

router.post("/outbound/opt-out", asyncHandler(async (req, res) => {
  const contactId = verifyOptOutToken(req.query.t);
  if (!contactId) {
    send(res, 400, page("Link not valid", "<p>This opt-out link is invalid or incomplete.</p>"));
    return;
  }
  const { count } = await prisma.account.updateMany({
    where: { id: contactId, isService: true },
    data: { allowFallbackMessage: false },
  });
  logger.info({ contactId, matched: count }, "outbound: business opted out of fallback messages");
  // Same answer whether or not the contact still exists: the link reveals nothing.
  send(res, 200, page("You're opted out", "<p>You will no longer receive these messages.</p>"));
}, "Failed to process opt-out"));

export default router;
