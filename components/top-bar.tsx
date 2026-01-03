"use client"

import { useState, useEffect } from "react"
import { Bell, Search, Users, Play, Eye } from "lucide-react"
import { getUnreadNotificationsCount } from "@/lib/storage"
import { generateTotalViewers, formatViewers } from "@/lib/viewers"
import Link from "next/link"

interface TopBarProps {
  onSearchClick: () => void
  onNotificationsClick: () => void
  totalMatches?: number
  liveMatches?: number
}

export function TopBar({ onSearchClick, onNotificationsClick, totalMatches = 0, liveMatches = 0 }: TopBarProps) {
  const [unreadCount, setUnreadCount] = useState(0)
  const [totalViewers, setTotalViewers] = useState(0)

  useEffect(() => {
    setUnreadCount(getUnreadNotificationsCount())
    setTotalViewers(generateTotalViewers())

    // Update viewers every 10 seconds
    const interval = setInterval(() => {
      setTotalViewers(generateTotalViewers())
    }, 10000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="fixed top-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-pink-500 rounded-xl flex items-center justify-center font-black text-white text-lg shadow-lg">
            S
          </div>
          <div>
            <h1 className="text-lg font-black text-foreground">Sports-Stream</h1>
            <p className="text-xs text-muted-foreground">by WaveWatch</p>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-3">
          <div className="flex items-center gap-2 bg-red-500/10 text-red-500 px-3 py-1.5 rounded-lg">
            <Play className="w-4 h-4 fill-current" />
            <span className="text-sm font-bold">{liveMatches} Live</span>
          </div>

          <div className="flex items-center gap-2 bg-blue-500/10 text-blue-500 px-3 py-1.5 rounded-lg">
            <Eye className="w-4 h-4" />
            <span className="text-sm font-bold">{totalMatches} Matchs</span>
          </div>

          <div className="flex items-center gap-2 bg-green-500/10 text-green-500 px-3 py-1.5 rounded-lg">
            <Users className="w-4 h-4" />
            <span className="text-sm font-bold">{formatViewers(totalViewers)}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/profile"
            className="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-muted transition-colors font-bold text-sm"
          >
            Ma Page
          </Link>

          <button
            onClick={onSearchClick}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
            aria-label="Rechercher"
          >
            <Search className="w-5 h-5" />
          </button>

          <button
            onClick={onNotificationsClick}
            className="p-2 rounded-lg hover:bg-muted transition-colors relative"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
