"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { SPORT_ICONS } from "@/lib/api"

interface SportCardProps {
  name: string
  count: number
  onClick: () => void
  index?: number
  animate?: boolean
}

export function SportCard({ name, count, onClick, index = 0, animate = true }: SportCardProps) {
  const [isVisible, setIsVisible] = useState(!animate)

  useEffect(() => {
    if (animate) {
      const timer = setTimeout(() => setIsVisible(true), index * 80)
      return () => clearTimeout(timer)
    }
  }, [index, animate])

  const icon = SPORT_ICONS[name] || "🏅"

  return (
    <div
      onClick={onClick}
      className={cn(
        "flex-shrink-0 w-[150px] sm:w-[170px] md:w-[190px] rounded-2xl p-5 sm:p-6 cursor-pointer",
        "bg-card border border-border transition-all duration-300 ease-out",
        "hover:-translate-y-2 hover:scale-105 hover:border-primary hover:shadow-xl",
        "active:scale-95 touch-manipulation relative overflow-hidden group",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6",
      )}
    >
      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="relative flex flex-col items-center gap-3 sm:gap-4">
        <span className="text-4xl sm:text-5xl transform group-hover:scale-125 group-hover:rotate-6 transition-transform">
          {icon}
        </span>
        <span className="font-bold text-sm sm:text-base text-foreground">{name}</span>
        <span className="text-xs sm:text-sm text-muted-foreground">
          {count} match{count > 1 ? "s" : ""}
        </span>
      </div>
    </div>
  )
}
