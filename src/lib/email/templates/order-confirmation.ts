import { BRAND, esc, firstName, gbp, shellHtml } from "./shared";
import { PHOTO_GUIDANCE, orderNeedsPhoto, whatsAppLink } from "@/lib/personalisation";

export interface OrderConfirmationInput {
  customerName: string;
  orderNumber: string;
  createdAt: string;
  items: Array<{
    name: string;
    options?: string;
    quantity: number;
    unitPrice: number;
    lineTotal?: number;
  }>;
  subtotal: number;
  shipping: number;
  shippingMethod: string;
  discountCode?: string;
  discountAmount?: number;
  total: number;
  shippingAddress: string;
  shippingName?: string;
  /** From store settings; omitted or blank hides the photo block entirely. */
  whatsAppNumber?: string;
}

function etaFor(method: string): string {
  const m = (method || "").toLowerCase();
  if (m.includes("24")) return "1–2 business days";
  if (m.includes("48")) return "2–3 business days";
  return "2–3 business days";
}

function niceMethod(method: string): string {
  if (!method) return "Royal Mail Tracked 48";
  if (/24|48/.test(method)) return method;
  return method;
}

export function renderOrderConfirmationEmail(input: OrderConfirmationInput): {
  subject: string;
  html: string;
} {
  const method = niceMethod(input.shippingMethod);
  const eta = etaFor(method);
  const date = new Date(input.createdAt).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const rows = input.items
    .map((it) => {
      const line = it.lineTotal ?? it.unitPrice * it.quantity;
      return `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid ${BRAND.border};">
            <div style="color:${BRAND.fg};font-weight:600;">${esc(it.name)}</div>
            ${it.options ? `<div style="color:${BRAND.muted};font-size:12px;">${esc(it.options)}</div>` : ""}
          </td>
          <td align="right" style="padding:10px 0;border-bottom:1px solid ${BRAND.border};color:${BRAND.fg};white-space:nowrap;">
            <div style="font-size:12px;color:${BRAND.muted};">${it.quantity} × ${gbp(it.unitPrice)}</div>
            <div style="font-weight:600;">${gbp(line)}</div>
          </td>
        </tr>`;
    })
    .join("");

  const discountRow =
    input.discountAmount && input.discountAmount > 0
      ? `<tr><td style="color:${BRAND.muted};padding:4px 0;">Discount${
          input.discountCode ? ` (${esc(input.discountCode)})` : ""
        }</td><td align="right" style="color:#7FD88F;padding:4px 0;">− ${gbp(
          input.discountAmount,
        )}</td></tr>`
      : "";

  // Photo request — only when the order actually contains something that needs
  // artwork, and only when a WhatsApp number is configured. It sits directly
  // under the greeting because it is the one thing the customer must DO; buried
  // under the totals it would be missed.
  const waLink = whatsAppLink(
    input.whatsAppNumber,
    `Order ${input.orderNumber} — here is my photo`,
  );
  const photoBlock =
    waLink && orderNeedsPhoto(input.items)
      ? `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px 0;">
      <tr><td style="background:${BRAND.card};border:1px solid ${BRAND.gold};border-radius:10px;padding:18px;">
        <div style="color:${BRAND.gold};font-weight:700;font-size:16px;margin:0 0 6px 0;">${esc(PHOTO_GUIDANCE.heading)}</div>
        <p style="margin:0 0 14px 0;color:${BRAND.fg};font-size:14px;">
          Your order includes something we personalise with your own picture. Tap below and your order number is filled in for you — just attach the photo.
        </p>
        <a href="${waLink}" style="display:inline-block;background:${BRAND.gold};color:#1a1200;text-decoration:none;font-weight:700;padding:12px 22px;border-radius:999px;font-size:15px;">Send my photo on WhatsApp</a>
        <p style="margin:14px 0 0 0;color:${BRAND.fg};font-size:13px;line-height:1.5;">
          <strong>${esc(PHOTO_GUIDANCE.sendAsFile)}</strong>
        </p>
        <p style="margin:8px 0 0 0;color:${BRAND.muted};font-size:12px;line-height:1.5;">
          ${esc(PHOTO_GUIDANCE.quality)} ${esc(PHOTO_GUIDANCE.minimum)}
        </p>
        <p style="margin:10px 0 0 0;color:${BRAND.muted};font-size:12px;">
          We start making your order as soon as your photo arrives.
        </p>
      </td></tr>
    </table>`
      : "";

  const inner = `
    <h1 style="font-family:Georgia,'Times New Roman',serif;color:${BRAND.gold};font-size:22px;margin:0 0 6px 0;">Thank you for your order!</h1>
    <p style="margin:0 0 18px 0;color:${BRAND.fg};">Hi ${esc(firstName(input.customerName))}, we've received your order and are getting it ready.</p>
    ${photoBlock}

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 18px 0;">
      <tr>
        <td style="color:${BRAND.muted};font-size:12px;text-transform:uppercase;letter-spacing:1px;">Order reference</td>
        <td align="right" style="color:${BRAND.muted};font-size:12px;text-transform:uppercase;letter-spacing:1px;">Order date</td>
      </tr>
      <tr>
        <td style="color:${BRAND.gold};font-family:'Courier New',monospace;font-weight:700;">${esc(input.orderNumber)}</td>
        <td align="right" style="color:${BRAND.fg};">${esc(date)}</td>
      </tr>
    </table>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 18px 0;">
      <tr><td colspan="2" style="color:${BRAND.muted};font-size:12px;text-transform:uppercase;letter-spacing:1px;padding-bottom:6px;">Items</td></tr>
      ${rows}
    </table>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 18px 0;">
      <tr><td style="color:${BRAND.muted};padding:4px 0;">Subtotal</td><td align="right" style="color:${BRAND.fg};padding:4px 0;">${gbp(input.subtotal)}</td></tr>
      <tr><td style="color:${BRAND.muted};padding:4px 0;">Shipping <span style="color:${BRAND.muted};font-size:12px;">(${esc(method)})</span></td><td align="right" style="color:${BRAND.fg};padding:4px 0;">${gbp(input.shipping)}</td></tr>
      ${discountRow}
      <tr><td style="padding-top:10px;border-top:1px solid ${BRAND.border};color:${BRAND.gold};font-weight:700;font-size:16px;">Grand Total</td><td align="right" style="padding-top:10px;border-top:1px solid ${BRAND.border};color:${BRAND.gold};font-weight:700;font-size:16px;">${gbp(input.total)}</td></tr>
    </table>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 18px 0;">
      <tr><td style="color:${BRAND.muted};font-size:12px;text-transform:uppercase;letter-spacing:1px;padding-bottom:6px;">Shipping to</td></tr>
      <tr><td style="color:${BRAND.fg};white-space:pre-line;">${esc(input.shippingName || input.customerName)}
${esc(input.shippingAddress)}</td></tr>
    </table>

    <div style="background:${BRAND.bg};border:1px solid ${BRAND.border};border-radius:6px;padding:14px 16px;margin:0 0 14px 0;">
      <div style="color:${BRAND.gold};font-weight:700;margin-bottom:4px;">Estimated delivery: ${esc(eta)}</div>
      <div style="color:${BRAND.muted};font-size:13px;">You will receive a dispatch notification once your order is on its way.</div>
    </div>

    <p style="color:${BRAND.muted};font-size:13px;margin:18px 0 0 0;">Questions? Reply to this email or contact us at <a href="mailto:${BRAND.contact}" style="color:${BRAND.gold};">${BRAND.contact}</a>.</p>
  `;

  return {
    subject: `${BRAND.name} — Order ${input.orderNumber} confirmed`,
    html: shellHtml(`Order ${input.orderNumber} confirmed`, inner),
  };
}
