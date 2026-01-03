"use client"

import { useState, useEffect } from "react"
import { X, Heart, Share2, Users, Calendar, ChevronRight, TrendingUp } from "lucide-react"
import type { Match, Stream } from "@/types/match"
import { getStreams, SPORT_COLORS, SPORT_ICONS, IMG_URL } from "@/lib/api"
import { addToHistory, toggleFavorite, isFavorite, getBettingBalance, addBet, addNotification } from "@/lib/storage"
import { generateViewerCount, formatViewers } from "@/lib/viewers"
import { cn } from "@/lib/utils"
import { LazyImage } from "./lazy-image"

interface MatchModalProps {
  match: Match | null
  onClose: () => void
}

export function MatchModal({ match, onClose }: MatchModalProps) {
  const [streams, setStreams] = useState<Stream[]>([])
  const [selectedStream, setSelectedStream] = useState<Stream | null>(null)
  const [loading, setLoading] = useState(false)
  const [isFav, setIsFav] = useState(false)
  const [viewers, setViewers] = useState(0)
  const [showBetting, setShowBetting] = useState(false)
  const [betAmount, setBetAmount] = useState(10)
  const [selectedBet, setSelectedBet] = useState<"home" | "away" | "draw" | null>(null)
  const [balance, setBalance] = useState(0)

  const isLive = match && match.date / 1000 <= Date.now() / 1000 && match.date / 1000 >= Date.now() / 1000 - 7200

  useEffect(() => {
    if (!match) return
    setIsFav(isFavorite(match.id))
    addToHistory(match)
    loadStreams()
    setViewers(generateViewerCount(match.id, isLive || false, match.popular))
    setBalance(getBettingBalance())

    if (isLive) {
      const interval = setInterval(() => {
        setViewers(generateViewerCount(match.id, isLive, match.popular))
      }, 15000)
      return () => clearInterval(interval)
    }
  }, [match])

  const loadStreams = async () => {
    if (!match?.sources?.[0]) return
    setLoading(true)
    try {
      const source = match.sources[0]
      const data = await getStreams(source.source, source.id)
      setStreams(data)
      if (data.length > 0) {
        setSelectedStream(data[0])
      }
    } catch (error) {
      console.error("Error loading streams:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleShare = async () => {
    if (!match) return
    try {
      if (navigator.share) {
        await navigator.share({
          title: match.title,
          text: `Regarder ${match.title}`,
          url: window.location.href,
        })
      }
    } catch (err) {
      console.log("Share error:", err)
    }
  }

  const handleToggleFavorite = () => {
    if (!match) return
    toggleFavorite(match.id)
    setIsFav(!isFav)
  }

  const handlePlaceBet = () => {
    if (!match || !selectedBet || betAmount <= 0 || betAmount > balance) return

    const odds = selectedBet === "draw" ? 3.5 : selectedBet === "home" ? 2.1 : 2.3
    const bet = {
      id: Date.now().toString(),
      matchId: match.id,
      matchTitle: match.title,
      sport: match.sport_name,
      betType: selectedBet,
      amount: betAmount,
      odds,
      timestamp: Date.now(),
      status: "pending",
    }

    addBet(bet)
    addNotification({
      type: "bet_placed",
      title: "Pari placé",
      message: `${betAmount} points sur ${selectedBet === "home" ? match.teams?.home?.name : selectedBet === "away" ? match.teams?.away?.name : "Match nul"}`,
    })

    setBalance(getBettingBalance())
    setShowBetting(false)
    setSelectedBet(null)
    setBetAmount(10)
  }

  if (!match) return null

  const colors = SPORT_COLORS[match.sport_name || "default"] || SPORT_COLORS.default
  const sportIcon = SPORT_ICONS[match.sport_name || "Other"] || "🏅"

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-card border border-border rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-border bg-background/50">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <span className="text-2xl md:text-3xl" style={{ color: colors.primary }}>
              {sportIcon}
            </span>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg md:text-xl font-black truncate">{match.title}</h2>
              <div className="flex items-center gap-3 text-xs md:text-sm text-muted-foreground">
                <span>{match.sport_name || "Sport"}</span>
                {match.category && <span>• {match.category}</span>}
                <span className="flex items-center gap-1 text-green-500">
                  <Users className="w-3.5 h-3.5" />
                  {formatViewers(viewers)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleFavorite}
              className={cn(
                "p-2 rounded-lg transition-all",
                isFav ? "text-pink-500 bg-pink-500/10" : "text-muted-foreground hover:bg-muted",
              )}
            >
              <Heart className={cn("w-5 h-5", isFav && "fill-current")} />
            </button>
            <button
              onClick={handleShare}
              className="p-2 rounded-lg text-muted-foreground hover:bg-muted transition-all"
            >
              <Share2 className="w-5 h-5" />
            </button>
            <button onClick={onClose} className="p-2 rounded-lg text-muted-foreground hover:bg-muted transition-all">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {selectedStream && (
            <div className="aspect-video bg-black relative">
              <iframe
                src={selectedStream.stream_url}
                className="w-full h-full"
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              />
            </div>
          )}

          <div className="p-4 md:p-6 space-y-6">
            {match.teams && (
              <div className="flex items-center justify-center gap-4 md:gap-12 max-w-3xl mx-auto">
                <div className="flex-1 flex flex-col items-center text-center max-w-[140px]">
                  <div className="relative w-20 h-20 md:w-28 md:h-28 mb-3">
                    <LazyImage
                      src={
                        match.teams.home.badge
                          ? `${IMG_URL}/badge/${match.teams.home.badge}.webp`
                          : "https://i.imgur.com/zdFYbFp.png?v=1"
                      }
                      alt={match.teams.home.name}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        e.currentTarget.src = "https://i.imgur.com/zdFYbFp.png?v=1"
                      }}
                    />
                  </div>
                  <h3 className="font-bold text-base md:text-lg">{match.teams.home.name}</h3>
                </div>

                <div className="flex flex-col items-center flex-shrink-0">
                  <div
                    className="text-3xl md:text-5xl font-black px-6 py-3 rounded-xl"
                    style={{ backgroundColor: `${colors.primary}20`, color: colors.primary }}
                  >
                    VS
                  </div>
                </div>

                <div className="flex-1 flex flex-col items-center text-center max-w-[140px]">
                  <div className="relative w-20 h-20 md:w-28 md:h-28 mb-3">
                    <LazyImage
                      src={
                        match.teams.away.badge
                          ? `${IMG_URL}/badge/${match.teams.away.badge}.webp`
                          : "https://i.imgur.com/zdFYbFp.png?v=1"
                      }
                      alt={match.teams.away.name}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        e.currentTarget.src = "https://i.imgur.com/zdFYbFp.png?v=1"
                      }}
                    />
                  </div>
                  <h3 className="font-bold text-base md:text-lg">{match.teams.away.name}</h3>
                </div>
              </div>
            )}

            <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-black text-lg flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-amber-500" />
                  Paris Sportifs
                </h3>
                <span className="text-sm font-bold text-muted-foreground">Solde: {balance} pts</span>
              </div>

              {!showBetting ? (
                <button
                  onClick={() => setShowBetting(true)}
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold py-3 rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all"
                >
                  Placer un pari
                </button>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => setSelectedBet("home")}
                      className={cn(
                        "p-3 rounded-lg border-2 transition-all text-center",
                        selectedBet === "home"
                          ? "border-amber-500 bg-amber-500/20"
                          : "border-border hover:border-amber-500/50",
                      )}
                    >
                      <div className="text-xs text-muted-foreground mb-1">{match.teams?.home?.name}</div>
                      <div className="font-bold text-lg">2.1x</div>
                    </button>
                    <button
                      onClick={() => setSelectedBet("draw")}
                      className={cn(
                        "p-3 rounded-lg border-2 transition-all text-center",
                        selectedBet === "draw"
                          ? "border-amber-500 bg-amber-500/20"
                          : "border-border hover:border-amber-500/50",
                      )}
                    >
                      <div className="text-xs text-muted-foreground mb-1">Match nul</div>
                      <div className="font-bold text-lg">3.5x</div>
                    </button>
                    <button
                      onClick={() => setSelectedBet("away")}
                      className={cn(
                        "p-3 rounded-lg border-2 transition-all text-center",
                        selectedBet === "away"
                          ? "border-amber-500 bg-amber-500/20"
                          : "border-border hover:border-amber-500/50",
                      )}
                    >
                      <div className="text-xs text-muted-foreground mb-1">{match.teams?.away?.name}</div>
                      <div className="font-bold text-lg">2.3x</div>
                    </button>
                  </div>

                  <div>
                    <label className="text-sm font-semibold mb-2 block">Montant du pari</label>
                    <input
                      type="number"
                      min="1"
                      max={balance}
                      value={betAmount}
                      onChange={(e) => setBetAmount(Number(e.target.value))}
                      className="w-full bg-background border border-border rounded-lg px-4 py-2 font-bold"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setShowBetting(false)
                        setSelectedBet(null)
                      }}
                      className="flex-1 bg-muted text-foreground font-bold py-3 rounded-lg hover:bg-muted/80 transition-all"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={handlePlaceBet}
                      disabled={!selectedBet || betAmount <= 0 || betAmount > balance}
                      className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold py-3 rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Confirmer
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-4 bg-background rounded-lg">
                <Calendar className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Date</p>
                  <p className="font-semibold text-sm">
                    {new Date(match.date * 1000).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-background rounded-lg">
                <Users className="w-5 h-5 text-green-500" />
                <div>
                  <p className="text-xs text-muted-foreground">Spectateurs</p>
                  <p className="font-semibold text-sm">{formatViewers(viewers)}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-background rounded-lg">
                <span className="text-2xl">{sportIcon}</span>
                <div>
                  <p className="text-xs text-muted-foreground">Sport</p>
                  <p className="font-semibold text-sm">{match.sport_name || "Sport"}</p>
                </div>
              </div>
            </div>

            {streams.length > 0 && (
              <div>
                <h3 className="font-black text-lg mb-4 flex items-center gap-2">
                  📺 Sources disponibles
                  <span className="text-sm font-normal text-muted-foreground">({streams.length})</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {streams.map((stream, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedStream(stream)}
                      className={cn(
                        "flex items-center justify-between p-4 rounded-lg border-2 transition-all text-left",
                        selectedStream === stream
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50 hover:bg-muted",
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "w-10 h-10 rounded-lg flex items-center justify-center font-bold",
                            selectedStream === stream ? "bg-primary text-primary-foreground" : "bg-muted",
                          )}
                        >
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-semibold text-sm">
                            {stream.stream_title || stream.stream_id || `Source ${index + 1}`}
                          </p>
                          <p className="text-xs text-muted-foreground">{stream.platform || "Stream"}</p>
                        </div>
                      </div>
                      {selectedStream === stream && <ChevronRight className="w-5 h-5 text-primary" />}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {loading && (
              <div className="text-center py-8">
                <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-muted-foreground mt-3">Chargement des sources...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
