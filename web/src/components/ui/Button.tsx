import * as React from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "ghost" | "danger" | "subtle";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary: "text-white bg-gradient-primary hover:brightness-110 active:brightness-95",
  ghost: "bg-surface-2 hover:bg-surface-3 text-ink",
  danger: "bg-danger-500 hover:bg-danger-600 text-white",
  subtle: "bg-transparent hover:bg-surface-2 text-ink-muted hover:text-ink",
};

const sizes: Record<Size, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-5 py-2.5 text-base",
};

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      loading,
      disabled,
      children,
      ...rest
    },
    ref,
  ) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-all disabled:opacity-50 disabled:pointer-events-none",
        variants[variant],
        sizes[size],
        className,
      )}
      {...rest}
    >
      {loading ? (
        <span
          aria-hidden
          className="inline-block h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin"
        />
      ) : null}
      {children}
    </button>
  ),
);
Button.displayName = "Button";
