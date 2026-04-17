import { Resend } from "resend";

// Sender identity. Switch to "orders@neversettlesaga.com" once the domain
// is verified in the Resend dashboard (Domains → Add → verify DNS). Until
// then, fall back to the safe noreply@ address to avoid hard bounces.
export const EMAIL_FROM =
  process.env.RESEND_FROM || "Never Settle Saga <sales@neversettlesaga.com>";
export const EMAIL_FROM_FALLBACK =
  "Never Settle Saga <noreply@neversettlesaga.com>";

let client: Resend | null = null;
function getClient(): Resend | null {
  if (client) return client;
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  client = new Resend(key);
  return client;
}

export interface SendArgs {
  to: string;
  subject: string;
  html: string;
}

// Send helper. Never throws — callers must be safe to ignore the result.
export async function sendEmail(rid: string, args: SendArgs): Promise<boolean> {
  try {
    const c = getClient();
    if (!c) {
      console.warn(`[${rid}] email skipped — RESEND_API_KEY not set`);
      return false;
    }
    if (!args.to) {
      console.warn(`[${rid}] email skipped — no recipient`);
      return false;
    }
    const { error } = await c.emails.send({
      from: EMAIL_FROM,
      to: args.to,
      subject: args.subject,
      html: args.html,
    });
    if (error) {
      console.error(`[${rid}] resend send failed:`, error);
      return false;
    }
    console.log(`[${rid}] email sent to ${args.to}: ${args.subject}`);
    return true;
  } catch (err) {
    console.error(`[${rid}] email send threw:`, err);
    return false;
  }
}
