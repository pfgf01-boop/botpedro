import * as React from "react";
import { cn } from "@/lib/cn";

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  icon?: React.ReactNode;
  tone?: "primary" | "secondary" | "danger" | "warning" | "neutral";
  className?: string;
}

const tones = {
  primary: "text-primary-400",
  secondary: "text-secondary-400",
  danger: "text-danger-400",
  warning: "text-warning-400",
  neutral: "text-ink",
} as const;

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = "neutral",
  className,
}: StatCardProps) {
  return (
    <div className={cn("rounded-lg bg-surface-1 p-5", className)}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
          {label}
        </p>
        {icon && (
          <span className={cn("text-ink-muted", tones[tone])}>{icon}</span>
        )}
      </div>
      <p className={cn("mt-3 text-2xl font-semibold", tones[tone])}>{value}</p>
      {hint && <p className="mt-1 text-xs text-ink-muted">{hint}</p>}
    </div>
  );
}
