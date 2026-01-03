"use client"

import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface PullRefreshIndicatorProps {
  pullDistance: number
  isRefreshing: boolean
  threshold?: number
}

export function PullRefreshIndicator({ pullDistance, isRefreshing, threshold = 80 }: PullRefreshIndicatorProps) {
  const progress = Math.min(pullDistance / threshold, 1)
  const shouldShow = pullDistance > 10 || isRefreshing

  return (
    <div
      className={cn(
        "fixed top-0 left-0 right-0 flex justify-center items-center transition-all duration-200 z-50 pointer-events-none",
        shouldShow ? "opacity-100" : "opacity-0",
      )}
      style={{ height: Math.max(pullDistance, isRefreshing ? 60 : 0) }}
    >
      <div
        className={cn(
          "w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center shadow-lg",
          isRefreshing && "animate-spin",
        )}
        style={{
          transform: `rotate(${progress * 360}deg)`,
        }}
      >
        {isRefreshing ? (
          <Loader2 className="w-5 h-5 text-primary" />
        ) : (
          <span
            className="text-lg"
            style={{
              opacity: progress,
              transform: `scale(${0.5 + progress * 0.5})`,
            }}
          >
            ⚽
          </span>
        )}
      </div>
    </div>
  )
}
