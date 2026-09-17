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
          "bg-brand-500/20 text-brand-600 border border-brand-500/30": variant === "default",
          "bg-brand-500 text-white": variant === "amber",
          "border border-brand-500/40 text-brand-500": variant === "outline",
        },
        className
      )}
    >
      {children}
    </span>
  );
}
