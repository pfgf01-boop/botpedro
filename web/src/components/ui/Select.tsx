import * as React from "react";
import { cn } from "@/lib/cn";

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...rest }, ref) => (
    <select
      ref={ref}
      className={cn(
        "w-full rounded-md bg-surface-3 px-3 py-2 text-sm text-ink transition-colors focus:bg-surface-4 appearance-none",
        "bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%2212%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%239aa7bf%22 stroke-width=%222%22><polyline points=%226,9 12,15 18,9%22/></svg>')] bg-no-repeat bg-[right_0.75rem_center] pr-9",
        className,
      )}
      {...rest}
    >
      {children}
    </select>
  ),
);
Select.displayName = "Select";
