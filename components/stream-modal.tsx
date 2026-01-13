"use client"
import { useState, useEffect, useRef, useCallback } from "react"
import type { Match, Stream } from "@/types/match"
import { getStreams, IMG_URL } from "@/lib/api"
import { toggleFavorite, isFavorite, addToHistory, addNotification as showNotification } from "@/lib/storage"
import { generateViewerCount } from "@/lib/viewers"
import {
  getEventStats,
  getEventTimeline,
  getEventLineup,
  searchEvent,
  lookupEvent,
  getEventTVBroadcasts,
} from "@/lib/sportsdb"
import type { SportsDBLineup } from "@/lib/sportsdb"
import { BettingPanel } from "./betting-panel"
import { Badge } from "@/components/ui/badge"
import { LazyImage } from "./ui/lazy-image"
import {
  X,
  Play,
  Eye,
  Bell,
  Signal,
  Calendar,
  MapPin,
  Loader2,
  Heart,
  Lock,
  Trophy,
  Users,
  Tv,
  Clock,
  Shield,
  Target,
  ExternalLink,
  Globe,
  Info,
  Unlock,
  TrendingUp,
} from "lucide-react"

import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { getBettingColor } from "@/lib/colors"

const AD_URLS = [
  "https://foreignabnormality.com/c6hhrkarxp?key=e92078d07ea567d3f06d271967492752",
  "https://otieu.com/4/10323906",
  "https://www.profitablegatecpm.com/b0d3u3p8?key=a1234567890",
]
const UNLOCK_DURATION = 10 * 60 * 1000 // 10 minutes
const UNLOCK_KEY = "sports-stream-unlock"

interface StreamModalProps {
  match: Match
  open?: boolean // Add open prop for compatibility
  onClose: () => void
}

export function StreamModal({ match, open = true, onClose }: StreamModalProps) {
  const [streams, setStreams] = useState<Stream[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStream, setSelectedStream] = useState<string>("")
  const [isFav, setIsFav] = useState(false)
  const [viewerCount, setViewerCount] = useState(0)
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)

  const [isStreamUnlocked, setIsStreamUnlocked] = useState(false)
  const [unlockLoading, setUnlockLoading] = useState(false)
  const [iframeLoading, setIframeLoading] = useState(false)

  const [loadingDetails, setLoadingDetails] = useState(true)
  const [stats, setStats] = useState<any[]>([])
  const [timeline, setTimeline] = useState<any[]>([])
  const [lineup, setLineup] = useState<SportsDBLineup[]>([])
  const [tvBroadcasts, setTvBroadcasts] = useState<any[]>([])
  const [eventDetails, setEventDetails] = useState<any>(null)

  const [showBetting, setShowBetting] = useState(true)

  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isMuted, setIsMuted] = useState(false)

  const parseTeamNames = () => {
    const titleParts = match.title.split(/\s+vs\s+|\s+-\s+/i)
    const homeName = match.teams?.home?.name || titleParts[0]?.trim() || "Équipe 1"
    const awayName = match.teams?.away?.name || titleParts[1]?.trim() || "Équipe 2"
    return { homeName, awayName }
  }

  const { homeName, awayName } = parseTeamNames()
  const homeBadge = match.teams?.home?.badge
  const awayBadge = match.teams?.away?.badge

  const homeColor = getBettingColor(homeName.toLowerCase())
  const awayColor = getBettingColor(awayName.toLowerCase())

  const hbUrl = homeBadge ? `${IMG_URL}/badge/${homeBadge}.webp` : "/team-badge.png"
  const abUrl = awayBadge ? `${IMG_URL}/badge/${awayBadge}.webp` : "/team-badge.png"

  const hasScore = match.score && (match.score.home !== null || match.score.away !== null)
  const homeScore = match.score?.home ?? match.home_score ?? "-"
  const awayScore = match.score?.away ?? match.away_score ?? "-"

  useEffect(() => {
    localStorage.removeItem(UNLOCK_KEY)
    setIsStreamUnlocked(false)
    setIframeLoading(false)

    setIsFav(isFavorite(match.id))
    addToHistory({
      matchId: match.id,
      title: match.title,
      sport: match.sport_name,
    })

    const now = Date.now() / 1000
    const isLive = match.date / 1000 <= now && match.date / 1000 >= now - 7200
    setViewerCount(generateViewerCount(match.id, isLive, match.popular || false))

    const interval = setInterval(() => {
      setViewerCount((prev) => {
        const change = Math.floor(Math.random() * 200) - 100
        return Math.max(0, prev + change)
      })
    }, 5000)

    return () => clearInterval(interval)
  }, [match])

  useEffect(() => {
    const isEnabled = localStorage.getItem(`match-notification-${match.id}`) === "true"
    setNotificationsEnabled(isEnabled)
  }, [match.id])

  useEffect(() => {
    async function loadMatchDetails() {
      setLoadingDetails(true)
      console.log("[v0] Loading stream modal details for:", match.title)

      try {
        const searchQuery = `${homeName.replace(/\s+/g, "_")}_vs_${awayName.replace(/\s+/g, "_")}`
        const events = await searchEvent(searchQuery)

        if (events.length > 0) {
          const event = events[0]
          const eventId = event.idEvent

          const [eventData, statsData, timelineData, lineupData, tvData] = await Promise.all([
            lookupEvent(eventId),
            getEventStats(eventId),
            getEventTimeline(eventId),
            getEventLineup(eventId),
            getEventTVBroadcasts(eventId),
          ])

          console.log("[v0] Stream modal data loaded:", {
            stats: statsData.length,
            timeline: timelineData.length,
            lineup: lineupData.length,
            tvBroadcasts: tvData.length,
          })

          setEventDetails(eventData)
          setStats(statsData)
          setTimeline(timelineData)
          setLineup(lineupData)
          setTvBroadcasts(tvData)
        }
      } catch (error) {
        console.error("[v0] Error loading match details:", error)
      } finally {
        setLoadingDetails(false)
      }
    }

    loadMatchDetails()
  }, [match, homeName, awayName])

  useEffect(() => {
    async function loadStreams() {
      setLoading(true)
      const allStreams: Stream[] = []

      console.log("[v0] Loading streams for match:", match.title)
      console.log("[v0] Match sources:", match.sources)

      for (const source of match.sources || []) {
        try {
          const s = await getStreams(source.source, source.id)
          console.log(`[v0] Streams from ${source.source}:`, s)
          allStreams.push(...s)
        } catch (e) {
          console.error("[v0] Error loading streams:", e)
        }
      }

      allStreams.sort((a, b) => (b.hd ? 1 : 0) - (a.hd ? 1 : 0))
      setStreams(allStreams)

      console.log("[v0] Total streams loaded:", allStreams.length)

      if (allStreams.length > 0) {
        setSelectedStream(allStreams[0].embedUrl)
        console.log("[v0] Selected stream:", allStreams[0].embedUrl)
      }

      setLoading(false)
    }

    loadStreams()
  }, [match.sources, match.title])

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
      }
    }
    window.addEventListener("keydown", handleEsc)
    return () => window.removeEventListener("keydown", handleEsc)
  }, [onClose])

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener("fullscreenchange", handleFullscreenChange)
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange)
  }, [])

  const handleUnlockStream = useCallback(() => {
    setUnlockLoading(true)

    const adUrl = AD_URLS[Math.floor(Math.random() * AD_URLS.length)]

    // Method 1: window.open with _blank (most reliable for user clicks)
    const newTab = window.open(adUrl, "_blank", "noopener,noreferrer")

    // Method 2: Create and click a link element as fallback
    if (!newTab || newTab.closed || typeof newTab.closed === "undefined") {
      const link = document.createElement("a")
      link.href = adUrl
      link.target = "_blank"
      link.rel = "noopener noreferrer"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }

    setTimeout(() => {
      setIsStreamUnlocked(true)
      setIframeLoading(true) // Start iframe loading
      localStorage.setItem(UNLOCK_KEY, JSON.stringify({ timestamp: Date.now() }))
      setUnlockLoading(false)

      showNotification({
        type: "success",
        title: "Merci pour votre soutien !",
        message: "Chargement du stream...",
      })
      setTimeout(() => {
        if (iframeRef.current) {
          try {
            // Try to unmute after autoplay starts
            iframeRef.current.contentWindow?.postMessage({ action: "play" }, "*")
            setTimeout(() => {
              iframeRef.current?.contentWindow?.postMessage({ action: "unmute" }, "*")
            }, 1000)
          } catch (e) {
            console.log("[v0] Could not control iframe:", e)
          }
        }
      }, 2000)
    }, 500) // Reduced delay
  }, [])

  const handleFavoriteToggle = () => {
    toggleFavorite(match.id, match.title, match.sport_name)
    setIsFav(!isFav)
  }

  const handleNotificationToggle = () => {
    setNotificationsEnabled(!notificationsEnabled)
    if (!notificationsEnabled) {
      localStorage.setItem(`match-notification-${match.id}`, "true")
      showNotification({
        type: "match_live",
        title: "Notifications activées",
        message: `Vous serez notifié pour ${homeName} vs ${awayName}`,
      })
    } else {
      localStorage.removeItem(`match-notification-${match.id}`)
      showNotification({
        type: "match_live",
        title: "Notifications désactivées",
        message: "Vous ne recevrez plus de notifications pour ce match",
      })
    }
  }

  const handleUnmute = () => {
    if (iframeRef.current) {
      try {
        iframeRef.current.contentWindow?.postMessage({ type: isMuted ? "unmute" : "mute" }, "*")
        setIsMuted(!isMuted)
        showNotification({
          type: "info",
          title: isMuted ? "Son activé" : "Son coupé",
          message: `Le son du stream a été ${isMuted ? "activé" : "coupé"}`,
        })
      } catch (e) {
        showNotification({
          type: "info",
          title: "Contrôle audio",
          message: "Utilisez les contrôles du lecteur pour le son",
        })
      }
    }
  }

  const handleFullscreen = () => {
    if (iframeRef.current) {
      if (!document.fullscreenElement) {
        iframeRef.current
          .requestFullscreen()
          .then(() => {
            setIsFullscreen(true)
            showNotification({
              type: "info",
              title: "Plein écran",
              message: "Appuyez sur Échap pour quitter",
            })
          })
          .catch(console.error)
      } else {
        document.exitFullscreen()
        setIsFullscreen(false)
      }
    }
  }

  const handleCast = () => {
    showNotification({
      type: "info",
      title: "Cast",
      message: "Utilisez l'icône Cast de votre navigateur ou l'extension Chrome",
    })
  }

  const statusBadgeVariant =
    match.status === "Finished" ? "secondary" : match.status === "Live" ? "destructive" : "outline"
  const statusText = match.status === "Finished" ? "Terminé" : match.status === "Live" ? "En direct" : "À venir"
  const formattedDate = new Date(match.date).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
  const formattedTime = new Date(match.date).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })

  const homeLineup = lineup.filter((player) => {
    const playerTeam = player.strTeam?.toLowerCase() || ""
    const homeNameLower = homeName.toLowerCase()
    return playerTeam.includes(homeNameLower) || homeNameLower.includes(playerTeam)
  })

  const awayLineup = lineup.filter((player) => {
    const playerTeam = player.strTeam?.toLowerCase() || ""
    const awayNameLower = awayName.toLowerCase()
    return playerTeam.includes(awayNameLower) || awayNameLower.includes(playerTeam)
  })

  const homeFormation = homeLineup[0]?.strFormation || eventDetails?.strHomeFormation || "4-3-3"
  const awayFormation = awayLineup[0]?.strFormation || eventDetails?.strAwayFormation || "4-2-3-1"

  const isBettingAllowed = () => {
    const now = Date.now()
    const matchStart = match.date
    const oneHourAfterStart = matchStart + 60 * 60 * 1000
    return now < oneHourAfterStart
  }

  const bettingAllowed = isBettingAllowed()

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="w-full max-w-full h-full sm:max-w-[95vw] md:max-w-[90vw] lg:max-w-[85vw] xl:max-w-7xl max-h-full sm:max-h-[98vh] md:max-h-[95vh] p-0 gap-0 bg-black/95 overflow-hidden"
        showCloseButton={false}
      >
        {/* Header */}
        <div className="flex-shrink-0 p-2 sm:p-3 md:p-4 border-b border-border bg-background/95 backdrop-blur-sm">
          <div className="flex items-start justify-between gap-2 sm:gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-1.5 flex-wrap">
                <Badge variant="outline" className="text-[10px] sm:text-xs px-1 sm:px-2">
                  {match.sport_name}
                </Badge>
                <Badge variant={statusBadgeVariant} className="text-[10px] sm:text-xs px-1 sm:px-2">
                  {statusText}
                </Badge>
                <Badge variant="outline" className="text-[10px] sm:text-xs gap-1 px-1 sm:px-2">
                  <Eye className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  {viewerCount.toLocaleString()}
                </Badge>
              </div>
              <h2 className="text-sm sm:text-lg md:text-xl font-black leading-tight truncate">
                {homeName} vs {awayName}
              </h2>
              <div className="flex flex-wrap items-center gap-1 sm:gap-2 text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">
                <span className="flex items-center gap-0.5 sm:gap-1">
                  <Calendar className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  {formattedDate}
                </span>
                <span className="flex items-center gap-0.5 sm:gap-1">
                  <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  {formattedTime}
                </span>
              </div>
            </div>

            <div className="flex gap-1 sm:gap-1.5 flex-shrink-0">
              <Button
                variant={isFav ? "default" : "outline"}
                size="sm"
                onClick={handleFavoriteToggle}
                className="gap-0.5 sm:gap-1 h-7 sm:h-8 px-1.5 sm:px-2"
              >
                <Heart className={`w-3 h-3 sm:w-4 sm:h-4 ${isFav ? "fill-current" : ""}`} />
                <span className="hidden md:inline text-xs">{isFav ? "Favoris" : "Ajouter"}</span>
              </Button>
              <Button
                variant={notificationsEnabled ? "default" : "outline"}
                size="sm"
                onClick={handleNotificationToggle}
                className="gap-0.5 sm:gap-1 h-7 sm:h-8 px-1.5 sm:px-2"
              >
                <Bell className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden md:inline text-xs">{notificationsEnabled ? "Activé" : "Notifier"}</span>
              </Button>
              <Button variant="ghost" size="icon" className="rounded-full h-7 w-7 sm:h-8 sm:w-8" onClick={onClose}>
                <X className="w-3 h-3 sm:w-4 sm:h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto relative">
          <div className="p-2 sm:p-3 md:p-4">
            {/* Main content */}
            <div className={`${bettingAllowed && showBetting ? "lg:pr-[420px]" : ""} transition-all duration-300`}>
              <div className="space-y-3 sm:space-y-4">
                {/* Stream player with lock overlay */}
                <div className="relative w-full aspect-video bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-lg overflow-hidden">
                  {loading ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <Loader2 className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 text-primary animate-spin" />
                        <p className="text-xs sm:text-sm font-medium px-4">Chargement du stream...</p>
                      </div>
                    </div>
                  ) : streams.length > 0 && selectedStream ? (
                    <>
                      {/* Lock modal - shown when stream is locked */}
                      {!isStreamUnlocked && (
                        <div className="absolute inset-0 bg-gradient-to-b from-black/95 via-black/90 to-black/95 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
                          <div className="text-center max-w-md w-full space-y-3 sm:space-y-4 md:space-y-6 my-auto">
                            {/* Lock Icon - hidden on small screens as requested */}
                            <div className="hidden sm:flex w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 mx-auto items-center justify-center">
                              <Lock
                                className="w-14 h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 text-red-500"
                                strokeWidth={1.5}
                              />
                            </div>

                            {/* Title */}
                            <h3 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-white">
                              Stream verrouillé
                            </h3>

                            {/* Message */}
                            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-300 px-2 sm:px-4">
                              Regardez une courte publicité pour débloquer ce stream
                            </p>

                            {/* Thank you message */}
                            <p className="text-red-500 font-semibold flex items-center justify-center gap-2 text-xs sm:text-sm md:text-base lg:text-lg">
                              Merci pour votre soutien{" "}
                              <Heart className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 fill-red-500" />
                            </p>

                            {/* Unlock Button */}
                            <Button
                              size="lg"
                              onClick={handleUnlockStream}
                              disabled={unlockLoading}
                              className="bg-red-600 hover:bg-red-700 text-white font-black text-sm sm:text-base md:text-lg lg:text-xl px-4 sm:px-6 md:px-8 lg:px-10 py-3 sm:py-4 md:py-5 lg:py-6 rounded-xl shadow-lg shadow-red-600/50 transition-all hover:scale-105 w-full sm:w-auto mx-auto disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {unlockLoading ? (
                                <>
                                  <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 mr-2 animate-spin" />
                                  Déverrouillage...
                                </>
                              ) : (
                                <>
                                  <Unlock className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 mr-2" />
                                  Débloquer le stream
                                  <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 ml-2" />
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      )}

                      {isStreamUnlocked && iframeLoading && (
                        <div className="absolute inset-0 bg-black/90 z-40 flex items-center justify-center">
                          <div className="text-center">
                            <Loader2 className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 text-red-500 animate-spin" />
                            <p className="text-sm sm:text-base md:text-lg font-bold text-white">
                              Connexion au stream...
                            </p>
                            <p className="text-xs sm:text-sm text-gray-400 mt-2">
                              Veuillez patienter quelques instants
                            </p>
                          </div>
                        </div>
                      )}

                      <iframe
                        ref={iframeRef}
                        src={
                          isStreamUnlocked
                            ? `${selectedStream}${selectedStream.includes("?") ? "&" : "?"}autoplay=1&muted=1&controls=1`
                            : "about:blank"
                        }
                        className="absolute inset-0 w-full h-full border-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                        allowFullScreen
                        onLoad={() => {
                          if (isStreamUnlocked) {
                            console.log("[v0] Iframe loaded successfully")
                            setIframeLoading(false)
                            setTimeout(() => {
                              if (iframeRef.current?.contentWindow) {
                                try {
                                  // Send multiple play commands to ensure it works
                                  iframeRef.current.contentWindow.postMessage(
                                    '{"event":"command","func":"playVideo","args":""}',
                                    "*",
                                  )
                                  iframeRef.current.contentWindow.postMessage({ action: "play", method: "play" }, "*")
                                  iframeRef.current.contentWindow.postMessage({ command: "play" }, "*")
                                } catch (e) {
                                  console.log("[v0] Cannot send play commands to iframe")
                                }
                              }
                            }, 1000)
                          }
                        }}
                        onError={() => {
                          setIframeLoading(false)
                        }}
                      />
                    </>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center px-4">
                        <Play className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 text-muted-foreground" />
                        <p className="text-xs sm:text-sm font-medium">Aucune source disponible</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Stream sources */}
                {streams.length > 1 && isStreamUnlocked && (
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    {streams.map((stream, idx) => (
                      <Button
                        key={idx}
                        variant={selectedStream === stream.embedUrl ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedStream(stream.embedUrl)}
                        className="text-[10px] sm:text-xs h-6 sm:h-7 px-2 sm:px-3"
                      >
                        {stream.hd && (
                          <Badge variant="secondary" className="text-[8px] sm:text-[10px] px-0.5 sm:px-1 py-0 mr-1">
                            HD
                          </Badge>
                        )}
                        Source {idx + 1}
                        {stream.language && (
                          <span className="ml-1 text-muted-foreground hidden sm:inline">({stream.language})</span>
                        )}
                      </Button>
                    ))}
                  </div>
                )}

                {/* Teams and score display */}
                <div className="bg-card border border-border rounded-lg p-3 sm:p-4">
                  <div className="flex items-center justify-center gap-3 sm:gap-4 md:gap-8">
                    {/* Home team */}
                    <div className="flex flex-col items-center gap-1.5 sm:gap-2 flex-1">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full overflow-hidden bg-muted flex items-center justify-center border-2 border-border">
                        <LazyImage src={hbUrl} alt={homeName} className="w-full h-full object-cover" />
                      </div>
                      <div className="text-center">
                        <h3 className="font-bold text-[10px] sm:text-xs md:text-sm line-clamp-2">{homeName}</h3>
                        <div
                          className="h-1 sm:h-1.5 rounded-full mt-0.5 sm:mt-1 mx-auto w-8 sm:w-12"
                          style={{ background: homeColor }}
                        />
                      </div>
                    </div>

                    {/* Score */}
                    <div className="flex flex-col items-center gap-1">
                      {hasScore ? (
                        <div className="flex items-center gap-1.5 sm:gap-2 bg-primary/10 px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg border border-primary/20">
                          <span className="text-xl sm:text-2xl md:text-3xl font-black">{homeScore}</span>
                          <span className="text-base sm:text-lg font-bold text-primary">-</span>
                          <span className="text-xl sm:text-2xl md:text-3xl font-black">{awayScore}</span>
                        </div>
                      ) : (
                        <span className="text-xl sm:text-2xl font-black text-muted-foreground">VS</span>
                      )}
                      {match.score?.status && (
                        <Badge variant="secondary" className="text-[8px] sm:text-[10px] px-1 sm:px-1.5">
                          {match.score.status}
                        </Badge>
                      )}
                    </div>

                    {/* Away team */}
                    <div className="flex flex-col items-center gap-1.5 sm:gap-2 flex-1">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full overflow-hidden bg-muted flex items-center justify-center border-2 border-border">
                        <LazyImage src={abUrl} alt={awayName} className="w-full h-full object-cover" />
                      </div>
                      <div className="text-center">
                        <h3 className="font-bold text-[10px] sm:text-xs md:text-sm line-clamp-2">{awayName}</h3>
                        <div
                          className="h-1 sm:h-1.5 rounded-full mt-0.5 sm:mt-1 mx-auto w-8 sm:w-12"
                          style={{ background: awayColor }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* All match info in single scrollable area */}
                <div className="bg-card border border-border rounded-lg p-3 sm:p-4 space-y-3 sm:space-y-4">
                  {/* Event details */}
                  {eventDetails && (
                    <div className="space-y-2 sm:space-y-3">
                      <h4 className="font-semibold text-xs sm:text-sm flex items-center gap-2">
                        <Trophy className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
                        Informations du Match
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2 text-xs">
                        {eventDetails.strLeague && (
                          <div className="flex items-start gap-1.5 sm:gap-2 p-2 sm:p-3 bg-muted/40 rounded-lg">
                            <Shield className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                            <div className="min-w-0">
                              <span className="text-muted-foreground block text-[9px] sm:text-[10px] uppercase tracking-wide">
                                Compétition
                              </span>
                              <span className="font-semibold text-[10px] sm:text-xs truncate block">
                                {eventDetails.strLeague}
                              </span>
                            </div>
                          </div>
                        )}
                        {eventDetails.strVenue && (
                          <div className="flex items-start gap-1.5 sm:gap-2 p-2 sm:p-3 bg-muted/40 rounded-lg">
                            <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                            <div className="min-w-0">
                              <span className="text-muted-foreground block text-[9px] sm:text-[10px] uppercase tracking-wide">
                                Stade
                              </span>
                              <span className="font-semibold text-[10px] sm:text-xs truncate block">
                                {eventDetails.strVenue}
                              </span>
                            </div>
                          </div>
                        )}
                        {eventDetails.strSeason && (
                          <div className="flex items-start gap-1.5 sm:gap-2 p-2 sm:p-3 bg-muted/40 rounded-lg">
                            <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                            <div className="min-w-0">
                              <span className="text-muted-foreground block text-[9px] sm:text-[10px] uppercase tracking-wide">
                                Saison
                              </span>
                              <span className="font-semibold text-[10px] sm:text-xs">{eventDetails.strSeason}</span>
                            </div>
                          </div>
                        )}
                        {eventDetails.intRound && (
                          <div className="flex items-start gap-1.5 sm:gap-2 p-2 sm:p-3 bg-muted/40 rounded-lg">
                            <Target className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                            <div className="min-w-0">
                              <span className="text-muted-foreground block text-[9px] sm:text-[10px] uppercase tracking-wide">
                                Tour
                              </span>
                              <span className="font-semibold text-[10px] sm:text-xs">
                                Journée {eventDetails.intRound}
                              </span>
                            </div>
                          </div>
                        )}
                        {eventDetails.intSpectators && Number.parseInt(eventDetails.intSpectators) > 0 && (
                          <div className="flex items-start gap-1.5 sm:gap-2 p-2 sm:p-3 bg-muted/40 rounded-lg">
                            <Users className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                            <div className="min-w-0">
                              <span className="text-muted-foreground block text-[9px] sm:text-[10px] uppercase tracking-wide">
                                Spectateurs
                              </span>
                              <span className="font-semibold text-[10px] sm:text-xs">
                                {Number.parseInt(eventDetails.intSpectators).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        )}
                        {eventDetails.strCity && (
                          <div className="flex items-start gap-1.5 sm:gap-2 p-2 sm:p-3 bg-muted/40 rounded-lg">
                            <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                            <div className="min-w-0">
                              <span className="text-muted-foreground block text-[9px] sm:text-[10px] uppercase tracking-wide">
                                Ville
                              </span>
                              <span className="font-semibold text-[10px] sm:text-xs truncate block">
                                {eventDetails.strCity}
                              </span>
                            </div>
                          </div>
                        )}
                        {eventDetails.strCountry && (
                          <div className="flex items-start gap-1.5 sm:gap-2 p-2 sm:p-3 bg-muted/40 rounded-lg">
                            <Globe className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                            <div className="min-w-0">
                              <span className="text-muted-foreground block text-[9px] sm:text-[10px] uppercase tracking-wide">
                                Pays
                              </span>
                              <span className="font-semibold text-[10px] sm:text-xs truncate block">
                                {eventDetails.strCountry}
                              </span>
                            </div>
                          </div>
                        )}
                        {eventDetails.strStatus && (
                          <div className="flex items-start gap-1.5 sm:gap-2 p-2 sm:p-3 bg-muted/40 rounded-lg">
                            <Info className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                            <div className="min-w-0">
                              <span className="text-muted-foreground block text-[9px] sm:text-[10px] uppercase tracking-wide">
                                Statut
                              </span>
                              <span className="font-semibold text-[10px] sm:text-xs capitalize">
                                {eventDetails.strStatus}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      {eventDetails.strDescriptionEN && (
                        <div className="p-2 sm:p-3 bg-muted/30 rounded-lg border border-border">
                          <p className="text-[10px] sm:text-xs text-muted-foreground leading-relaxed line-clamp-3">
                            {eventDetails.strDescriptionEN}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Statistics */}
                  {stats.length > 0 && (
                    <div className="space-y-1.5 sm:space-y-2 pt-2 sm:pt-3 border-t border-border">
                      <h4 className="font-semibold text-xs sm:text-sm flex items-center gap-2">
                        <Signal className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
                        Statistiques
                      </h4>
                      <div className="space-y-1 sm:space-y-1.5">
                        {stats.slice(0, 10).map((stat: any, idx: number) => (
                          <div
                            key={idx}
                            className="flex justify-between items-center text-[10px] sm:text-xs p-1 sm:p-1.5 bg-muted/20 rounded"
                          >
                            <span className="font-medium w-10 sm:w-12 text-right">{stat.intHome || "-"}</span>
                            <span className="text-muted-foreground flex-1 text-center text-[9px] sm:text-[10px]">
                              {stat.strStat}
                            </span>
                            <span className="font-medium w-10 sm:w-12">{stat.intAway || "-"}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Timeline */}
                  {timeline.length > 0 && (
                    <div className="space-y-1.5 sm:space-y-2 pt-2 sm:pt-3 border-t border-border">
                      <h4 className="font-semibold text-xs sm:text-sm flex items-center gap-2">
                        <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
                        Chronologie
                      </h4>
                      <div className="space-y-1 max-h-32 sm:max-h-40 overflow-y-auto">
                        {timeline.map((event: any, idx: number) => (
                          <div
                            key={idx}
                            className="flex items-start gap-1.5 sm:gap-2 text-[10px] sm:text-xs p-1 sm:p-1.5 bg-muted/20 rounded"
                          >
                            <Badge
                              variant="outline"
                              className="text-[8px] sm:text-[10px] px-1 sm:px-1.5 py-0 flex-shrink-0"
                            >
                              {event.intTime}'
                            </Badge>
                            <div className="flex-1 min-w-0">
                              <span className="font-medium block truncate">{event.strTimeline}</span>
                              {event.strPlayer && (
                                <span className="text-muted-foreground text-[9px] sm:text-[10px]">
                                  {event.strPlayer}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Lineup */}
                  {lineup.length > 0 && (
                    <div className="space-y-1.5 sm:space-y-2 pt-2 sm:pt-3 border-t border-border">
                      <h4 className="font-semibold text-xs sm:text-sm flex items-center gap-2">
                        <Users className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
                        Compositions ({homeFormation} vs {awayFormation})
                      </h4>
                      <div className="grid grid-cols-2 gap-2 sm:gap-3">
                        <div className="space-y-0.5 sm:space-y-1">
                          <h5 className="text-[9px] sm:text-[10px] font-medium text-muted-foreground truncate">
                            {homeName}
                          </h5>
                          {homeLineup.slice(0, 11).map((player, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between p-0.5 sm:p-1 bg-muted/20 rounded text-[9px] sm:text-[10px]"
                            >
                              <div className="flex items-center gap-0.5 sm:gap-1 min-w-0">
                                <span className="font-mono text-muted-foreground w-3 sm:w-4 flex-shrink-0">
                                  {player.intSquadNumber || idx + 1}
                                </span>
                                <span className="font-medium truncate">{player.strPlayer}</span>
                              </div>
                              {player.strPosition && (
                                <Badge
                                  variant="outline"
                                  className="text-[7px] sm:text-[8px] px-0.5 sm:px-1 py-0 flex-shrink-0"
                                >
                                  {player.strPosition}
                                </Badge>
                              )}
                            </div>
                          ))}
                        </div>
                        <div className="space-y-0.5 sm:space-y-1">
                          <h5 className="text-[9px] sm:text-[10px] font-medium text-muted-foreground truncate">
                            {awayName}
                          </h5>
                          {awayLineup.slice(0, 11).map((player, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between p-0.5 sm:p-1 bg-muted/20 rounded text-[9px] sm:text-[10px]"
                            >
                              <div className="flex items-center gap-0.5 sm:gap-1 min-w-0">
                                <span className="font-mono text-muted-foreground w-3 sm:w-4 flex-shrink-0">
                                  {player.intSquadNumber || idx + 1}
                                </span>
                                <span className="font-medium truncate">{player.strPlayer}</span>
                              </div>
                              {player.strPosition && (
                                <Badge
                                  variant="outline"
                                  className="text-[7px] sm:text-[8px] px-0.5 sm:px-1 py-0 flex-shrink-0"
                                >
                                  {player.strPosition}
                                </Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TV Broadcasts */}
                  {tvBroadcasts.length > 0 && (
                    <div className="space-y-1.5 sm:space-y-2 pt-2 sm:pt-3 border-t border-border">
                      <h4 className="font-semibold text-xs sm:text-sm flex items-center gap-2">
                        <Tv className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
                        Diffusions TV ({tvBroadcasts.length})
                      </h4>
                      <div className="grid grid-cols-2 gap-1 sm:gap-1.5">
                        {tvBroadcasts.map((broadcast: any, idx: number) => (
                          <div
                            key={idx}
                            className="flex items-center gap-1.5 sm:gap-2 p-1 sm:p-1.5 bg-muted/20 rounded text-[10px] sm:text-xs"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">{broadcast.strChannel}</div>
                              {broadcast.strCountry && (
                                <div className="text-[9px] sm:text-[10px] text-muted-foreground truncate">
                                  {broadcast.strCountry}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* No data message */}
                  {!loadingDetails &&
                    !eventDetails &&
                    stats.length === 0 &&
                    timeline.length === 0 &&
                    lineup.length === 0 && (
                      <div className="text-center py-4 sm:py-6 text-muted-foreground">
                        <Signal className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-1.5 sm:mb-2 opacity-50" />
                        <p className="text-xs sm:text-sm px-4">Aucune information supplémentaire disponible</p>
                      </div>
                    )}

                  {loadingDetails && (
                    <div className="text-center py-4 sm:py-6">
                      <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-1.5 sm:mb-2 text-primary animate-spin" />
                      <p className="text-[10px] sm:text-xs text-muted-foreground">Chargement des détails...</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Betting panel - positioned absolutely on the right on large screens */}
            {bettingAllowed && showBetting && (
              <div className="lg:fixed lg:right-4 lg:top-[120px] lg:bottom-4 lg:w-[400px] mt-3 sm:mt-4 lg:mt-0">
                <div className="bg-card border border-border rounded-lg p-3 sm:p-4 h-full lg:overflow-y-auto">
                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <h3 className="text-sm sm:text-base font-bold flex items-center gap-1.5 sm:gap-2">
                      <Signal className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
                      Paris rapide
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowBetting(false)}
                      className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                    >
                      <X className="w-3 h-3 sm:w-4 sm:h-4" />
                    </Button>
                  </div>
                  <BettingPanel match={match} compact />
                </div>
              </div>
            )}

            {/* Show betting button */}
            {bettingAllowed && !showBetting && (
              <div className="fixed bottom-3 right-3 sm:bottom-4 sm:right-4 z-50">
                <Button
                  onClick={() => setShowBetting(true)}
                  className="bg-amber-500 hover:bg-amber-600 text-white shadow-lg text-xs sm:text-sm h-8 sm:h-auto px-3 sm:px-4"
                >
                  <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                  <span className="hidden xs:inline">Afficher les </span>paris
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
