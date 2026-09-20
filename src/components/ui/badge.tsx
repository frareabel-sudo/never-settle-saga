import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "amber" | "outline";
}

export function Badge({ children, className, variant = "default" }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider",
        {
          // Badges sit on top of product photography, so they are opaque with a
          // shadow. A 20%-alpha tint was legible on the old dark theme and
          // turned to mush over bright, busy artwork.
          "bg-white/95 text-brand-600 border border-brand-500/20 shadow-sm": variant === "default",
          "bg-brand-500 text-white shadow-sm": variant === "amber",
          "border border-brand-500/40 text-brand-500": variant === "outline",
        },
        className
      )}
    >
      {children}
    </span>
  );
}
