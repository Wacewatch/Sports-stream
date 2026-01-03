"use client"

import { Sun, Moon } from "lucide-react"
import { cn } from "@/lib/utils"

interface ThemeToggleProps {
  isDark: boolean
  onToggle: () => void
}

export function ThemeToggle({ isDark, onToggle }: ThemeToggleProps) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        "relative w-14 h-7 rounded-full transition-colors duration-300",
        isDark ? "bg-slate-700" : "bg-amber-400",
      )}
      aria-label="Toggle theme"
    >
      <div
        className={cn(
          "absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-all duration-300 flex items-center justify-center",
          isDark ? "left-0.5" : "left-7",
        )}
      >
        {isDark ? <Moon className="w-4 h-4 text-slate-700" /> : <Sun className="w-4 h-4 text-amber-500" />}
      </div>
    </button>
  )
}
