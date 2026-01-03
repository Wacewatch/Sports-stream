"use client"

import type React from "react"

import { useState, useEffect } from "react"
import type { Match } from "@/types/match"
import { IMG_URL } from "@/lib/api"
import { isFavorite } from "@/lib/storage"
import { generateViewerCount, formatViewers } from "@/lib/viewers"
import { LazyImage } from "./lazy-image"
import { cn } from "@/lib/utils"
import { Heart, Users } from "lucide-react"

interface MatchCardProps {
  match: Match
  onClick: () => void
  onDetails?: (match: Match, e: React.MouseEvent) => void
  index?: number
  animate?: boolean
}

export function MatchCard({ match, onClick, onDetails, index = 0, animate = true }: MatchCardProps) {
  const [isVisible, setIsVisible] = useState(!animate)
  const [favorite, setFavorite] = useState(false)
  const [viewers, setViewers] = useState(0)

  const isLive = match.date / 1000 <= Date.now() / 1000 && match.date / 1000 >= Date.now() / 1000 - 7200

  useEffect(() => {
    if (animate) {
      const timer = setTimeout(() => setIsVisible(true), index * 100)
      return () => clearTimeout(timer)
    }
  }, [index, animate])

  useEffect(() => {
    setFavorite(isFavorite(match.id))
    setViewers(generateViewerCount(match.id, isLive, match.popular))

    if (isLive) {
      const interval = setInterval(() => {
        setViewers(generateViewerCount(match.id, isLive, match.popular))
      }, 15000)
      return () => clearInterval(interval)
    }
  }, [match.id, isLive, match.popular])

  useEffect(() => {
    const handleStorageChange = () => {
      setFavorite(isFavorite(match.id))
    }

    window.addEventListener("storage", handleStorageChange)
    // Also listen for custom event for same-tab updates
    window.addEventListener("favoriteToggled", handleStorageChange)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
      window.removeEventListener("favoriteToggled", handleStorageChange)
    }
  }, [match.id])

  const homeBadge = match.teams?.home?.badge
  const awayBadge = match.teams?.away?.badge
  const hbUrl = homeBadge ? `${IMG_URL}/badge/${homeBadge}.webp` : "https://i.imgur.com/zdFYbFp.png?v=1"
  const abUrl = awayBadge ? `${IMG_URL}/badge/${awayBadge}.webp` : "https://i.imgur.com/zdFYbFp.png?v=1"

  const hasScore = match.score && (match.score.home !== null || match.score.away !== null)

  return (
    <div
      onClick={onClick}
      className={cn(
        "flex-shrink-0 w-[280px] sm:w-[300px] md:w-[320px] rounded-2xl overflow-hidden cursor-pointer",
        "bg-card border border-border transition-all duration-400 ease-out group",
        "hover:scale-[1.04] hover:-translate-y-2 hover:shadow-2xl hover:border-primary",
        "active:scale-[0.98] touch-manipulation",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
      )}
    >
      <div className="relative aspect-video bg-background/50 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/60 z-10" />

        {isLive && (
          <span className="absolute top-3 left-3 z-20 bg-gradient-to-r from-red-600 to-red-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide shadow-lg animate-pulse">
            🔴 LIVE
          </span>
        )}
        <span className="absolute top-3 right-3 z-20 bg-blue-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-lg">
          {match.sport_name}
        </span>

        {favorite && (
          <span className="absolute bottom-3 right-3 z-20 bg-pink-500 p-2 rounded-full shadow-lg animate-pulse">
            <Heart className="w-4 h-4 text-white fill-current" />
          </span>
        )}

        <div className="absolute bottom-3 left-3 z-20 bg-black/70 backdrop-blur-sm px-2.5 py-1.5 rounded-lg flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-green-400" />
          <span className="text-xs font-bold text-white">{formatViewers(viewers)}</span>
        </div>

        <div className="absolute inset-0 flex items-center justify-around px-4 z-10">
          <div className="flex flex-col items-center gap-2 transform group-hover:scale-110 transition-transform">
            <LazyImage
              src={hbUrl}
              alt={match.teams?.home?.name || "Home"}
              className="w-14 h-14 sm:w-16 sm:h-16 drop-shadow-2xl"
            />
            <span className="text-xs sm:text-sm font-bold text-white text-center max-w-[90px] truncate text-shadow-lg">
              {match.teams?.home?.name || "Équipe 1"}
            </span>
          </div>

          {hasScore ? (
            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-2 bg-black/80 backdrop-blur-sm px-4 py-2 rounded-lg">
                <span className="text-2xl font-black text-white">{match.score!.home ?? "-"}</span>
                <span className="text-lg font-bold text-amber-400">-</span>
                <span className="text-2xl font-black text-white">{match.score!.away ?? "-"}</span>
              </div>
              {match.score!.status && (
                <span className="text-[10px] font-bold text-amber-400 uppercase bg-black/60 px-2 py-0.5 rounded">
                  {match.score!.status}
                </span>
              )}
            </div>
          ) : (
            <span className="text-xl sm:text-2xl font-black text-amber-400 drop-shadow-lg">VS</span>
          )}

          <div className="flex flex-col items-center gap-2 transform group-hover:scale-110 transition-transform">
            <LazyImage
              src={abUrl}
              alt={match.teams?.away?.name || "Away"}
              className="w-14 h-14 sm:w-16 sm:h-16 drop-shadow-2xl"
            />
            <span className="text-xs sm:text-sm font-bold text-white text-center max-w-[90px] truncate text-shadow-lg">
              {match.teams?.away?.name || "Équipe 2"}
            </span>
          </div>
        </div>
      </div>

      <div className="p-4 bg-card">
        <h3 className="font-bold text-sm sm:text-base line-clamp-2 mb-3 text-foreground">{match.title}</h3>
        <div className="flex justify-between items-center text-xs sm:text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            🕐{" "}
            {new Date(match.date).toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
          <span className="flex items-center gap-1.5">📺 {match.sources?.length || 0}</span>
        </div>
      </div>
    </div>
  )
}
