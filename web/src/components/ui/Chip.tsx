import * as React from "react";
import { cn } from "@/lib/cn";

export interface ChipProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: "neutral" | "primary" | "secondary" | "warning" | "danger";
}

const tones: Record<NonNullable<ChipProps["tone"]>, string> = {
  neutral: "bg-surface-3 text-ink",
  primary: "bg-primary-500/15 text-primary-300",
  secondary: "bg-secondary-500/15 text-secondary-300",
  warning: "bg-warning-500/15 text-warning-400",
  danger: "bg-danger-500/15 text-danger-400",
};

export function Chip({ className, tone = "neutral", ...rest }: ChipProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        tones[tone],
        className,
      )}
      {...rest}
    />
  );
}
