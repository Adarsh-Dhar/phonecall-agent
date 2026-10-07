/**
 * Telephony Service — placeholder for real auto-dial functionality.
 *
 * This service will integrate with a telephony provider (e.g., Exotel) to
 * place actual phone calls when the scheduler triggers a task.
 *
 * This is a placeholder implementation. To enable real auto-dial:
 * 1. Implement the placeCall function with your telephony provider's API
 * 2. Set up webhooks to receive call status updates (ringing, answered, no-answer, busy, voicemail)
 * 3. Map webhook events to Call.status and outcome
 * 4. Enable via AUTODIAL_ENABLED environment variable
 */

export interface TelephonyProvider {
  placeCall(params: PlaceCallParams): Promise<PlaceCallResult>;
}

export interface PlaceCallParams {
  to: string; // Phone number to call
  from: string; // Caller ID
  taskId: string;
  callId: string;
}

export interface PlaceCallResult {
  success: boolean;
  providerCallId?: string;
  error?: string;
}

/**
 * Placeholder telephony provider.
 * Returns a failure result until a real provider is implemented.
 */
class PlaceholderTelephonyProvider implements TelephonyProvider {
  async placeCall(params: PlaceCallParams): Promise<PlaceCallResult> {
    // TODO: Implement with actual telephony provider (e.g., Exotel)
    // For now, this is a placeholder that always fails
    return {
      success: false,
      error: "Telephony provider not implemented. Set up Exotel or other provider to enable auto-dial.",
    };
  }
}

/**
 * Global telephony provider instance.
 * Set this to a real implementation to enable auto-dial.
 */
let telephonyProvider: TelephonyProvider = new PlaceholderTelephonyProvider();

export function setTelephonyProvider(provider: TelephonyProvider): void {
  telephonyProvider = provider;
}

export function getTelephonyProvider(): TelephonyProvider {
  return telephonyProvider;
}

/**
 * Place a call using the configured telephony provider.
 */
export async function placeCall(params: PlaceCallParams): Promise<PlaceCallResult> {
  return telephonyProvider.placeCall(params);
}

/**
 * Check if auto-dial is enabled globally.
 */
export function isAutoDialEnabled(): boolean {
  return process.env.AUTODIAL_ENABLED === "true";
}
