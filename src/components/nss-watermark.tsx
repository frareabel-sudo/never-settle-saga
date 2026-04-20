// NSS watermark SVG placeholder — used when a variant has zero tagged + zero master photos.
// IMPORTANT: opacity is baked in via `fill-opacity` / `stroke-opacity` attributes (NOT CSS),
// so this component renders identically in OG/social previews, Resend email HTML, and the
// Nelko/Epson/Brother thermal print pipelines where CSS opacity is stripped or ignored.

const RAW_SVG = (label: string) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${escapeXml(label)}">
  <rect width="400" height="400" fill="#1a1a1a" fill-opacity="1"/>
  <rect x="0" y="0" width="400" height="400" fill="#f59e0b" fill-opacity="0.08"/>
  <g transform="translate(200 170)" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif">
    <text y="0" fill="#f59e0b" fill-opacity="0.75" font-size="48" font-weight="700" letter-spacing="4">NSS</text>
    <text y="36" fill="#e5e7eb" fill-opacity="0.55" font-size="14" letter-spacing="3">NEVER SETTLE SAGA</text>
    <line x1="-70" y1="60" x2="70" y2="60" stroke="#f59e0b" stroke-opacity="0.4" stroke-width="1"/>
    <text y="96" fill="#9ca3af" fill-opacity="0.8" font-size="16" font-style="italic">${escapeXml(label)}</text>
  </g>
</svg>`;

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** Raw SVG string — for email templates, OG images, and print PDFs where React isn't mounted. */
export function nssWatermarkSvg(label = "Image coming soon"): string {
  return RAW_SVG(label);
}

/** Data URL suitable for <img src=…> when Next.js Image has no usable URL. */
export function nssWatermarkDataUrl(label = "Image coming soon"): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(RAW_SVG(label))}`;
}

/** React component — inlines the same SVG so browser opacity matches print/email output. */
export function NssWatermark({ className, label = "Image coming soon" }: { className?: string; label?: string }) {
  return (
    <div
      className={className}
      role="img"
      aria-label={label}
      dangerouslySetInnerHTML={{ __html: RAW_SVG(label) }}
    />
  );
}
