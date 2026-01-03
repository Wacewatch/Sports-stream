"use client"

import type { Match } from "@/types/match"
import { IMG_URL } from "@/lib/api"
import { LazyImage } from "./lazy-image"
import { Play, Clock, Tv, Trophy } from "lucide-react"

interface HeroSectionProps {
  match: Match
  onClick: () => void
}

export function HeroSection({ match, onClick }: HeroSectionProps) {
  const homeBadge = match.teams?.home?.badge
  const awayBadge = match.teams?.away?.badge
  const hbUrl = homeBadge ? `${IMG_URL}/badge/${homeBadge}.webp` : "https://i.imgur.com/zdFYbFp.png?v=1"
  const abUrl = awayBadge ? `${IMG_URL}/badge/${awayBadge}.webp` : "https://i.imgur.com/zdFYbFp.png?v=1"

  const isLive = match.date / 1000 <= Date.now() / 1000 && match.date / 1000 >= Date.now() / 1000 - 7200
  const hasScore = match.score && (match.score.home !== null || match.score.away !== null)

  return (
    <section
      onClick={onClick}
      className="relative min-h-[420px] md:min-h-[480px] flex items-center justify-center overflow-hidden bg-gradient-to-br from-card to-background cursor-pointer group"
    >
      {/* Background */}
      {homeBadge && awayBadge && (
        <div
          className="absolute inset-0 bg-cover bg-center opacity-15 blur-sm group-hover:opacity-20 group-hover:scale-105 transition-all duration-500"
          style={{
            backgroundImage: `url('${IMG_URL}/poster/${homeBadge}/${awayBadge}.webp')`,
          }}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/80 to-background" />

      {/* Content */}
      <div className="relative z-10 w-full max-w-6xl px-4 sm:px-6 py-8 md:py-12">
        {/* Badge */}
        <div className="flex justify-center mb-6 md:mb-8">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 px-4 sm:px-6 py-2 sm:py-2.5 rounded-full backdrop-blur-sm">
            {isLive ? (
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            ) : (
              <span className="w-2 h-2 bg-amber-400 rounded-full" />
            )}
            <span className="text-xs sm:text-sm font-bold text-primary">
              {isLive ? "🔴 EN DIRECT" : "⭐ MATCH POPULAIRE"}
            </span>
          </div>
        </div>

        {/* Teams - Mobile: Vertical, Desktop: Horizontal */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12 lg:gap-20">
          {/* Home Team */}
          <div className="flex flex-col items-center gap-3 sm:gap-4 group-hover:scale-105 transition-transform">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <LazyImage
                src={hbUrl}
                alt={match.teams?.home?.name || "Home"}
                className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 lg:w-36 lg:h-36 drop-shadow-2xl relative z-10"
              />
            </div>
            <span className="text-lg sm:text-xl md:text-2xl font-black text-foreground text-center max-w-[180px]">
              {match.teams?.home?.name || "Équipe 1"}
            </span>
          </div>

          <div className="flex flex-col items-center gap-4 md:gap-6">
            {hasScore ? (
              <>
                <div className="flex items-center gap-4 text-5xl sm:text-6xl md:text-7xl font-black">
                  <span className="text-primary drop-shadow-lg">{match.score!.home ?? "-"}</span>
                  <span className="text-muted-foreground">-</span>
                  <span className="text-primary drop-shadow-lg">{match.score!.away ?? "-"}</span>
                </div>
                {match.score!.status && (
                  <span className="text-xs sm:text-sm font-bold text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full">
                    {match.score!.status}
                  </span>
                )}
              </>
            ) : (
              <span className="text-5xl sm:text-6xl md:text-7xl font-black text-amber-400 drop-shadow-lg">VS</span>
            )}

            {/* Play Button - Desktop only */}
            <button className="hidden md:flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-full font-bold transition-all hover:scale-105 shadow-xl">
              <Play className="w-5 h-5 fill-current" />
              Regarder
            </button>
          </div>

          {/* Away Team */}
          <div className="flex flex-col items-center gap-3 sm:gap-4 group-hover:scale-105 transition-transform">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <LazyImage
                src={abUrl}
                alt={match.teams?.away?.name || "Away"}
                className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 lg:w-36 lg:h-36 drop-shadow-2xl relative z-10"
              />
            </div>
            <span className="text-lg sm:text-xl md:text-2xl font-black text-foreground text-center max-w-[180px]">
              {match.teams?.away?.name || "Équipe 2"}
            </span>
          </div>
        </div>

        {/* Match Info */}
        <div className="mt-6 md:mt-8 text-center">
          <h2 className="text-base sm:text-lg md:text-xl font-bold text-foreground mb-4 max-w-2xl mx-auto line-clamp-2">
            {match.title}
          </h2>

          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-muted-foreground">
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-muted/50 rounded-lg text-xs sm:text-sm">
              <Trophy className="w-4 h-4" />
              {match.sport_name}
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-muted/50 rounded-lg text-xs sm:text-sm">
              <Clock className="w-4 h-4" />
              {new Date(match.date).toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-muted/50 rounded-lg text-xs sm:text-sm">
              <Tv className="w-4 h-4" />
              {match.sources?.length || 0} streams
            </span>
          </div>
        </div>

        {/* Mobile Play Button */}
        <div className="mt-6 flex justify-center md:hidden">
          <button className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 rounded-full font-bold transition-all active:scale-95 shadow-xl">
            <Play className="w-5 h-5 fill-current" />
            Regarder maintenant
          </button>
        </div>
      </div>
    </section>
  )
}
