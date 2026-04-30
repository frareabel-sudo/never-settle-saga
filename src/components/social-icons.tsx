import type { ContactSettings } from "@/lib/store-settings";

type IconProps = { className?: string };

export function InstagramIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 2.2c3.2 0 3.6 0 4.85.07 1.17.05 1.8.25 2.23.42.56.21.96.47 1.38.89.42.42.68.82.89 1.38.17.42.37 1.06.42 2.23.06 1.26.07 1.64.07 4.84s0 3.6-.07 4.85c-.05 1.17-.25 1.8-.42 2.23a3.7 3.7 0 0 1-.89 1.38 3.7 3.7 0 0 1-1.38.89c-.42.17-1.06.37-2.23.42-1.26.06-1.64.07-4.85.07s-3.6 0-4.85-.07c-1.17-.05-1.8-.25-2.23-.42a3.7 3.7 0 0 1-1.38-.89 3.7 3.7 0 0 1-.89-1.38c-.17-.42-.37-1.06-.42-2.23C2.2 15.6 2.2 15.2 2.2 12s0-3.6.07-4.85c.05-1.17.25-1.8.42-2.23.21-.56.47-.96.89-1.38.42-.42.82-.68 1.38-.89.42-.17 1.06-.37 2.23-.42C8.4 2.2 8.8 2.2 12 2.2zm0 1.8c-3.15 0-3.5 0-4.74.07-.95.04-1.46.2-1.8.34-.45.18-.78.39-1.12.73-.34.34-.55.66-.73 1.12-.13.34-.3.86-.34 1.8C3.04 8.5 3 8.85 3 12s0 3.5.07 4.74c.04.95.2 1.46.34 1.8.18.45.39.78.73 1.12.34.34.66.55 1.12.73.34.13.86.3 1.8.34 1.25.07 1.6.07 4.74.07s3.5 0 4.74-.07c.95-.04 1.46-.2 1.8-.34.45-.18.78-.39 1.12-.73.34-.34.55-.66.73-1.12.13-.34.3-.86.34-1.8.07-1.25.07-1.6.07-4.74s0-3.5-.07-4.74c-.04-.95-.2-1.46-.34-1.8a3 3 0 0 0-.73-1.12 3 3 0 0 0-1.12-.73c-.34-.13-.86-.3-1.8-.34C15.5 4 15.15 4 12 4zm0 3.06a4.94 4.94 0 1 1 0 9.88 4.94 4.94 0 0 1 0-9.88zm0 1.8a3.14 3.14 0 1 0 0 6.28 3.14 3.14 0 0 0 0-6.28zm5.13-2.3a1.16 1.16 0 1 1-2.32 0 1.16 1.16 0 0 1 2.32 0z" />
    </svg>
  );
}

export function FacebookIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M13.5 21.95v-8.6h2.9l.43-3.36H13.5V7.85c0-.97.27-1.63 1.66-1.63h1.77V3.21A23.7 23.7 0 0 0 14.34 3c-2.55 0-4.3 1.55-4.3 4.4v2.6H7.13v3.36H10v8.6h3.5z" />
    </svg>
  );
}

export function TwitterIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export function TikTokIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43V8.66a8.16 8.16 0 0 0 4.77 1.52V6.73a4.85 4.85 0 0 1-1.84-.04z" />
    </svg>
  );
}

export function YouTubeIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M23.5 6.5a3 3 0 0 0-2.1-2.1C19.5 4 12 4 12 4s-7.5 0-9.4.4A3 3 0 0 0 .5 6.5C.1 8.4.1 12 .1 12s0 3.6.4 5.5a3 3 0 0 0 2.1 2.1C4.5 20 12 20 12 20s7.5 0 9.4-.4a3 3 0 0 0 2.1-2.1c.4-1.9.4-5.5.4-5.5s0-3.6-.4-5.5zM9.7 15.5v-7l6.3 3.5z" />
    </svg>
  );
}

export function WhatsAppIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M17.5 14.4c-.3-.1-1.7-.8-2-.9-.3-.1-.5-.1-.7.1l-.9 1.2c-.2.2-.3.3-.6.1-.3-.1-1.3-.5-2.5-1.5-1-.8-1.6-1.9-1.8-2.2-.2-.3 0-.4.1-.6.1-.1.3-.3.4-.5l.3-.4c.1-.2 0-.3 0-.5-.1-.1-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.5c-.2 0-.5.1-.7.4-.3.3-1 .9-1 2.3 0 1.4 1 2.7 1.1 2.9.1.2 1.9 2.9 4.7 4.1.7.3 1.2.5 1.6.6.7.2 1.3.2 1.8.1.5-.1 1.7-.7 1.9-1.4.2-.7.2-1.2.2-1.4-.1-.2-.3-.3-.5-.4zM12 2a10 10 0 0 0-8.5 15.3L2 22l4.8-1.5A10 10 0 1 0 12 2zm0 18.2c-1.6 0-3.2-.4-4.5-1.3l-.3-.2-3.2 1 .9-3.1-.2-.3a8.3 8.3 0 1 1 7.3 4z" />
    </svg>
  );
}

export interface SocialEntry {
  Icon: (p: IconProps) => JSX.Element;
  label: string;
  href: string;
}

export function buildSocials(social: ContactSettings["social"]): SocialEntry[] {
  const wa = (social.whatsapp || "").trim();
  const waHref = wa
    ? wa.startsWith("http")
      ? wa
      : `https://wa.me/${wa.replace(/[^0-9]/g, "")}`
    : "";
  return [
    { Icon: InstagramIcon, label: "Instagram", href: (social.instagram || "").trim() },
    { Icon: FacebookIcon, label: "Facebook", href: (social.facebook || "").trim() },
    { Icon: TwitterIcon, label: "X / Twitter", href: (social.twitter || "").trim() },
    { Icon: TikTokIcon, label: "TikTok", href: (social.tiktok || "").trim() },
    { Icon: YouTubeIcon, label: "YouTube", href: (social.youtube || "").trim() },
    { Icon: WhatsAppIcon, label: "WhatsApp", href: waHref },
  ].filter((s) => s.href.length > 0);
}
