import * as React from "react";
import { cn } from "@/lib/cn";

type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  tier?: 1 | 2 | 3;
  padded?: boolean;
};

const tiers = {
  1: "bg-surface-1 shadow-tier1",
  2: "bg-surface-2 shadow-tier2",
  3: "bg-surface-3",
} as const;

export function Card({
  className,
  tier = 1,
  padded = true,
  ...rest
}: CardProps) {
  return (
    <div
      className={cn(
        "rounded-lg",
        tiers[tier],
        padded && "p-5",
        className,
      )}
      {...rest}
    />
  );
}

export function CardHeader({
  className,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex items-start justify-between gap-4 mb-4", className)}
      {...rest}
    />
  );
}

export function CardTitle({
  className,
  ...rest
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn("text-base font-semibold text-ink", className)}
      {...rest}
    />
  );
}

export function CardDescription({
  className,
  ...rest
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("text-sm text-ink-muted", className)} {...rest} />
  );
}
