export const BRAND = {
  name: "Never Settle Saga",
  site: "https://neversettlesaga.com",
  contact: "helpdesk@neversettlesaga.com",
  instagram: "https://instagram.com/neversettlesaga",
  gold: "#D4A020",
  goldLight: "#E8B843",
  bg: "#0A0A0A",
  card: "#141414",
  fg: "#F5F0E8",
  muted: "#A19B90",
  border: "#2A2520",
};

export function gbp(n: number | undefined | null): string {
  const v = typeof n === "number" ? n : 0;
  return `£${v.toFixed(2)}`;
}

export function esc(s: string | undefined | null): string {
  if (!s) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function firstName(name: string | undefined | null): string {
  if (!name) return "there";
  const first = String(name).trim().split(/\s+/)[0];
  return first || "there";
}

export function headerHtml(): string {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.bg};">
      <tr>
        <td align="center" style="padding:32px 24px 20px 24px;">
          <div style="font-family:Georgia,'Times New Roman',serif;font-size:28px;letter-spacing:2px;color:${BRAND.gold};font-weight:700;">
            ${BRAND.name.toUpperCase()}
          </div>
          <div style="height:2px;width:80px;background:${BRAND.gold};margin:10px auto 0 auto;"></div>
        </td>
      </tr>
    </table>
  `;
}

export function footerHtml(): string {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.bg};">
      <tr>
        <td align="center" style="padding:28px 24px 36px 24px;color:${BRAND.muted};font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.7;">
          <a href="${BRAND.site}" style="color:${BRAND.gold};text-decoration:none;">neversettlesaga.com</a>
          &nbsp;·&nbsp;
          <a href="mailto:${BRAND.contact}" style="color:${BRAND.gold};text-decoration:none;">${BRAND.contact}</a>
          &nbsp;·&nbsp;
          <a href="${BRAND.instagram}" style="color:${BRAND.gold};text-decoration:none;">Instagram</a>
          <div style="margin-top:10px;color:${BRAND.muted};">© ${new Date().getFullYear()} ${BRAND.name}. All rights reserved.</div>
        </td>
      </tr>
    </table>
  `;
}

export function shellHtml(title: string, inner: string): string {
  return `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title></head>
<body style="margin:0;padding:0;background:${BRAND.bg};color:${BRAND.fg};font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.bg};">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <tr><td>${headerHtml()}</td></tr>
        <tr><td style="background:${BRAND.card};border:1px solid ${BRAND.border};border-radius:8px;padding:28px 28px 24px 28px;color:${BRAND.fg};font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.55;">
          ${inner}
        </td></tr>
        <tr><td>${footerHtml()}</td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}
