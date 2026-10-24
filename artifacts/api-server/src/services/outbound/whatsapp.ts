/**
 * WhatsApp over Meta's WhatsApp Business Cloud API (graph.facebook.com), no third-party gateway.
 * Business-initiated messages MUST use a pre-approved template, so this sends one template with a
 * single body variable ({{1}}) that carries the whole message.
 *
 * Env: WHATSAPP_TOKEN (permanent system-user token), WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_TEMPLATE_NAME,
 *      WHATSAPP_TEMPLATE_LANG (default "en"), WHATSAPP_API_VERSION (default "v21.0").
 * Without the first three, sending is disabled and every call returns false.
 */
import { logger } from "../../lib/logger";

export const whatsappConfigured = () =>
  !!process.env.WHATSAPP_TOKEN && !!process.env.WHATSAPP_PHONE_NUMBER_ID && !!process.env.WHATSAPP_TEMPLATE_NAME;

/** Meta rejects template variables with newlines, tabs or 4+ consecutive spaces, and caps length. */
export function toTemplateParam(text: string): string {
  return text.replace(/[\r\n\t]+/g, " ").replace(/ {4,}/g, "   ").trim().slice(0, 1000);
}

/** `to` must be E.164 (see phone.ts). */
export async function sendWhatsApp(input: { to: string; text: string }): Promise<boolean> {
  if (!whatsappConfigured()) return false;
  const version = process.env.WHATSAPP_API_VERSION || "v21.0";
  try {
    const res = await fetch(`https://graph.facebook.com/${version}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: input.to.replace(/^\+/, ""),
        type: "template",
        template: {
          name: process.env.WHATSAPP_TEMPLATE_NAME,
          language: { code: process.env.WHATSAPP_TEMPLATE_LANG || "en" },
          components: [{ type: "body", parameters: [{ type: "text", text: toTemplateParam(input.text) }] }],
        },
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      logger.error({ status: res.status }, "outbound/whatsapp: provider rejected the message");
      return false;
    }
    return true;
  } catch (err) {
    logger.error({ err }, "outbound/whatsapp: send failed");
    return false;
  }
}
