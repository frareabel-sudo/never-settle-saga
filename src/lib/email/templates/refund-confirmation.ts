import { BRAND, esc, firstName, gbp, shellHtml } from "./shared";

export interface RefundConfirmationInput {
  customerName: string;
  orderNumber: string;
  amount: number;
  type: "full" | "partial";
}

export function renderRefundConfirmationEmail(
  input: RefundConfirmationInput,
): { subject: string; html: string } {
  const label = input.type === "full" ? "Full Refund" : "Partial Refund";
  const body =
    input.type === "full"
      ? "Your full payment has been refunded. Depending on your bank, this may take 5–10 business days to appear."
      : "A partial refund has been processed for your order. Depending on your bank, this may take 5–10 business days to appear.";

  const inner = `
    <h1 style="font-family:Georgia,'Times New Roman',serif;color:${BRAND.gold};font-size:22px;margin:0 0 6px 0;">Your refund is on its way</h1>
    <p style="margin:0 0 18px 0;color:${BRAND.fg};">Hi ${esc(firstName(input.customerName))}, we've processed a refund on your order.</p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 18px 0;">
      <tr><td style="color:${BRAND.muted};font-size:12px;text-transform:uppercase;letter-spacing:1px;padding:4px 0;">Order reference</td>
          <td align="right" style="color:${BRAND.gold};font-family:'Courier New',monospace;font-weight:700;padding:4px 0;">${esc(input.orderNumber)}</td></tr>
      <tr><td style="color:${BRAND.muted};font-size:12px;text-transform:uppercase;letter-spacing:1px;padding:4px 0;">Refund type</td>
          <td align="right" style="color:${BRAND.fg};padding:4px 0;">${esc(label)}</td></tr>
      <tr><td style="padding-top:10px;border-top:1px solid ${BRAND.border};color:${BRAND.gold};font-weight:700;font-size:16px;">Amount refunded</td>
          <td align="right" style="padding-top:10px;border-top:1px solid ${BRAND.border};color:${BRAND.gold};font-weight:700;font-size:16px;">${gbp(input.amount)}</td></tr>
    </table>

    <div style="background:${BRAND.bg};border:1px solid ${BRAND.border};border-radius:6px;padding:14px 16px;margin:0 0 14px 0;color:${BRAND.fg};">
      ${esc(body)}
    </div>

    <p style="color:${BRAND.muted};font-size:13px;margin:18px 0 0 0;">If you have any questions, contact us at <a href="mailto:${BRAND.contact}" style="color:${BRAND.gold};">${BRAND.contact}</a>.</p>
  `;

  return {
    subject: `${BRAND.name} — Refund processed for ${input.orderNumber}`,
    html: shellHtml(`Refund processed for ${input.orderNumber}`, inner),
  };
}
