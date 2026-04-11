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
          "bg-amber-500/20 text-amber-300 border border-amber-500/30": variant === "default",
          "bg-amber-500 text-charcoal-900": variant === "amber",
          "border border-amber-500/40 text-amber-400": variant === "outline",
        },
        className
      )}
    >
      {children}
    </span>
  );
}
