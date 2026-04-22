import * as React from "react";
import { cn } from "@/lib/cn";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, leftIcon, rightIcon, ...rest }, ref) => (
    <div className={cn("relative flex items-center", className)}>
      {leftIcon && (
        <span className="absolute left-3 text-ink-muted pointer-events-none">
          {leftIcon}
        </span>
      )}
      <input
        ref={ref}
        className={cn(
          "w-full rounded-md bg-surface-3 px-3 py-2 text-sm text-ink placeholder:text-ink-dim transition-colors focus:bg-surface-4",
          leftIcon && "pl-9",
          rightIcon && "pr-9",
        )}
        {...rest}
      />
      {rightIcon && (
        <span className="absolute right-3 text-ink-muted">{rightIcon}</span>
      )}
    </div>
  ),
);
Input.displayName = "Input";
