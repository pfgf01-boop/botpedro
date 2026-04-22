import { cn } from "@/lib/cn";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-md bg-[linear-gradient(110deg,#1f2d4a_30%,#263655_50%,#1f2d4a_70%)] bg-[length:200%_100%] animate-shimmer",
        className,
      )}
    />
  );
}
