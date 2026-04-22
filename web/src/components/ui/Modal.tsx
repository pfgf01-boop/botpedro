"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}

const sizes = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
} as const;

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
}: ModalProps) {
  React.useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-canvas-sunken/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={cn(
          "w-full rounded-xl bg-surface-1 shadow-popover animate-fadeUp",
          sizes[size],
        )}
      >
        {(title || description) && (
          <div className="px-6 pt-6 pb-4 flex items-start justify-between gap-4">
            <div>
              {title && (
                <h2 className="text-lg font-semibold text-ink">{title}</h2>
              )}
              {description && (
                <p className="text-sm text-ink-muted mt-1">{description}</p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-ink-muted hover:text-ink p-1 rounded-md hover:bg-surface-2"
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
        <div className="px-6 pb-4">{children}</div>
        {footer && (
          <div className="px-6 py-4 bg-surface-2 rounded-b-xl flex justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
