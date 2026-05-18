"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value = 0, ...props }, ref) => {
    const percentage = Math.min(100, Math.max(0, value));
    
    // Choose color scheme based on utilization thresholds
    const getBarColor = (val: number) => {
      if (val >= 90) return 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]';
      if (val >= 70) return 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]';
      return 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]';
    };

    return (
      <div
        ref={ref}
        className={cn(
          "relative h-2 w-full overflow-hidden rounded-full bg-neutral-800",
          className
        )}
        {...props}
      >
        <div
          className={cn("h-full rounded-full transition-all duration-500 ease-out", getBarColor(percentage))}
          style={{ width: `${percentage}%` }}
        />
      </div>
    )
  }
)
Progress.displayName = "Progress"

export { Progress }
