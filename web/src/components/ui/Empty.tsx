import * as React from "react";
import { cn } from "@/lib/cn";

interface EmptyProps {
  title: string;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export function Empty({ title, description, icon, action, className }: EmptyProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center py-12 px-6",
        className,
      )}
    >
      {icon && (
        <div className="mb-4 w-12 h-12 rounded-full bg-surface-2 flex items-center justify-center text-ink-muted">
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold text-ink">{title}</h3>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-ink-muted">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
