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
  Maximize,
  Volume2,
  VolumeX,
  Cast,
  Minimize,
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
import { openAdWithBypass } from "@/lib/ad-bypass"

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
    const unlockData = localStorage.getItem(UNLOCK_KEY)
    if (unlockData) {
      try {
        const { timestamp } = JSON.parse(unlockData)
        if (Date.now() - timestamp < UNLOCK_DURATION) {
          setIsStreamUnlocked(true)
        } else {
          localStorage.removeItem(UNLOCK_KEY)
          setIsStreamUnlocked(false)
        }
      } catch {
        localStorage.removeItem(UNLOCK_KEY)
      }
    }

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

    // Open multiple ads with different methods
    const adUrl1 = AD_URLS[Math.floor(Math.random() * AD_URLS.length)]
    const adUrl2 = AD_URLS[Math.floor(Math.random() * AD_URLS.length)]

    openAdWithBypass(adUrl1)
    setTimeout(() => {
      openAdWithBypass(adUrl2)
    }, 300)

    // Unlock after delay
    setTimeout(() => {
      setIsStreamUnlocked(true)
      localStorage.setItem(UNLOCK_KEY, JSON.stringify({ timestamp: Date.now() }))
      setUnlockLoading(false)

      showNotification({
        type: "success",
        title: "Merci pour votre soutien !",
        message: "Bon visionnage de votre match.",
      })
    }, 1200)
  }, [openAdWithBypass, showNotification])

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
        className="max-w-[95vw] lg:max-w-[85vw] xl:max-w-7xl w-full max-h-[95vh] h-full p-0 gap-0 bg-black/95"
        showCloseButton={false}
      >
        {/* Header */}
        <div className="flex-shrink-0 p-3 md:p-4 border-b border-border bg-background/95 backdrop-blur-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <Badge variant="outline" className="text-xs">
                  {match.sport_name}
                </Badge>
                <Badge variant={statusBadgeVariant} className="text-xs">
                  {statusText}
                </Badge>
                <Badge variant="outline" className="text-xs gap-1">
                  <Eye className="w-3 h-3" />
                  {viewerCount.toLocaleString()}
                </Badge>
              </div>
              <h2 className="text-lg md:text-xl font-black leading-tight truncate">
                {homeName} vs {awayName}
              </h2>
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mt-1">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formattedDate}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formattedTime}
                </span>
              </div>
            </div>

            <div className="flex gap-1.5 flex-shrink-0">
              <Button
                variant={isFav ? "default" : "outline"}
                size="sm"
                onClick={handleFavoriteToggle}
                className="gap-1 h-8 px-2"
              >
                <Heart className={`w-4 h-4 ${isFav ? "fill-current" : ""}`} />
                <span className="hidden sm:inline text-xs">{isFav ? "Favoris" : "Ajouter"}</span>
              </Button>
              <Button
                variant={notificationsEnabled ? "default" : "outline"}
                size="sm"
                onClick={handleNotificationToggle}
                className="gap-1 h-8 px-2"
              >
                <Bell className="w-4 h-4" />
                <span className="hidden sm:inline text-xs">{notificationsEnabled ? "Activé" : "Notifier"}</span>
              </Button>
              <Button variant="ghost" size="icon" className="rounded-full h-8 w-8" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto relative">
          <div className="p-3 md:p-4">
            {/* Main content - always full width */}
            <div className={`${bettingAllowed && showBetting ? "lg:pr-[420px]" : ""} transition-all duration-300`}>
              <div className="space-y-4">
                {/* Stream player with lock overlay */}
                <div className="relative w-full aspect-video bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-lg overflow-hidden group">
                  {loading ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <Loader2 className="w-12 h-12 mx-auto mb-3 text-primary animate-spin" />
                        <p className="text-sm font-medium">Chargement du stream...</p>
                      </div>
                    </div>
                  ) : streams.length > 0 && selectedStream ? (
                    <>
                      {!isStreamUnlocked && (
                        <div className="absolute inset-0 bg-gradient-to-b from-black/95 via-black/90 to-black/95 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
                          <div className="text-center max-w-md w-full space-y-4 sm:space-y-6 my-auto">
                            {/* Lock Icon */}
                            <div className="hidden sm:flex w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 mx-auto items-center justify-center">
                              <Lock
                                className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 text-red-500"
                                strokeWidth={1.5}
                              />
                            </div>

                            {/* Title */}
                            <h3 className="text-2xl sm:text-3xl md:text-4xl font-black text-white">
                              Stream verrouillé
                            </h3>

                            {/* Message */}
                            <p className="text-base sm:text-lg md:text-xl text-gray-300 px-2 sm:px-4">
                              Regardez une courte publicité pour débloquer ce stream
                            </p>

                            {/* Thank you message */}
                            <p className="text-red-500 font-semibold flex items-center justify-center gap-2 text-sm sm:text-base md:text-lg">
                              Merci pour votre soutien <Heart className="w-4 h-4 sm:w-5 sm:h-5 fill-red-500" />
                            </p>

                            {/* Unlock Button */}
                            <Button
                              size="lg"
                              onClick={handleUnlockStream}
                              disabled={unlockLoading}
                              className="bg-red-600 hover:bg-red-700 text-white font-black text-base sm:text-lg md:text-xl px-6 sm:px-8 md:px-10 py-4 sm:py-5 md:py-6 rounded-xl shadow-lg shadow-red-600/50 transition-all hover:scale-105 w-full sm:w-auto mx-auto disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {unlockLoading ? (
                                <>
                                  <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 mr-2 animate-spin" />
                                  Déverrouillage...
                                </>
                              ) : (
                                <>
                                  <Unlock className="w-5 h-5 sm:w-6 sm:h-6 mr-2" />
                                  Débloquer le stream
                                  <ExternalLink className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      )}

                      <iframe
                        ref={iframeRef}
                        src={
                          isStreamUnlocked
                            ? `${selectedStream}${selectedStream.includes("?") ? "&" : "?"}autoplay=1&muted=0`
                            : "about:blank"
                        }
                        className="w-full h-full"
                        allowFullScreen
                        allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                      />

                      {/* Controls overlay */}
                      {isStreamUnlocked && (
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Signal className="w-4 h-4 text-green-500" />
                              <span className="text-xs text-white font-medium">
                                {streams.find((s) => s.embedUrl === selectedStream)?.hd ? "HD" : "SD"}
                              </span>
                              <span className="text-xs text-white/70">
                                <Eye className="w-3 h-3 inline mr-1" />
                                {viewerCount.toLocaleString()}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-white hover:bg-white/20"
                                onClick={handleUnmute}
                              >
                                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-white hover:bg-white/20"
                                onClick={handleCast}
                              >
                                <Cast className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-white hover:bg-white/20"
                                onClick={handleFullscreen}
                              >
                                {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <Play className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                        <p className="text-sm font-medium">Aucune source disponible</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Stream sources */}
                {streams.length > 1 && (
                  <div className="flex flex-wrap gap-2">
                    {streams.map((stream, idx) => (
                      <Button
                        key={idx}
                        variant={selectedStream === stream.embedUrl ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedStream(stream.embedUrl)}
                        className="text-xs h-7"
                      >
                        {stream.hd && (
                          <Badge variant="secondary" className="text-[10px] px-1 py-0 mr-1">
                            HD
                          </Badge>
                        )}
                        Source {idx + 1}
                        {stream.language && <span className="ml-1 text-muted-foreground">({stream.language})</span>}
                      </Button>
                    ))}
                  </div>
                )}

                {/* Teams and score display */}
                <div className="bg-card border border-border rounded-lg p-4">
                  <div className="flex items-center justify-center gap-4 md:gap-8">
                    {/* Home team */}
                    <div className="flex flex-col items-center gap-2 flex-1">
                      <div className="w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden bg-muted flex items-center justify-center border-2 border-border">
                        <LazyImage src={hbUrl} alt={homeName} className="w-full h-full object-cover" />
                      </div>
                      <div className="text-center">
                        <h3 className="font-bold text-xs md:text-sm">{homeName}</h3>
                        <div className="h-1.5 rounded-full mt-1 mx-auto w-12" style={{ background: homeColor }} />
                      </div>
                    </div>

                    {/* Score */}
                    <div className="flex flex-col items-center gap-1">
                      {hasScore ? (
                        <div className="flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-lg border border-primary/20">
                          <span className="text-2xl md:text-3xl font-black">{homeScore}</span>
                          <span className="text-lg font-bold text-primary">-</span>
                          <span className="text-2xl md:text-3xl font-black">{awayScore}</span>
                        </div>
                      ) : (
                        <span className="text-2xl font-black text-muted-foreground">VS</span>
                      )}
                      {match.score?.status && (
                        <Badge variant="secondary" className="text-[10px]">
                          {match.score.status}
                        </Badge>
                      )}
                    </div>

                    {/* Away team */}
                    <div className="flex flex-col items-center gap-2 flex-1">
                      <div className="w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden bg-muted flex items-center justify-center border-2 border-border">
                        <LazyImage src={abUrl} alt={awayName} className="w-full h-full object-cover" />
                      </div>
                      <div className="text-center">
                        <h3 className="font-bold text-xs md:text-sm">{awayName}</h3>
                        <div className="h-1.5 rounded-full mt-1 mx-auto w-12" style={{ background: awayColor }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* All match info in single scrollable area */}
                <div className="bg-card border border-border rounded-lg p-4 space-y-4">
                  {/* Event details */}
                  {eventDetails && (
                    <div className="space-y-3">
                      <h4 className="font-semibold text-sm flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-primary" />
                        Informations du Match
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {eventDetails.strLeague && (
                          <div className="flex items-start gap-2 p-3 bg-muted/40 rounded-lg">
                            <Shield className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                            <div>
                              <span className="text-muted-foreground block text-[10px] uppercase tracking-wide">
                                Compétition
                              </span>
                              <span className="font-semibold">{eventDetails.strLeague}</span>
                            </div>
                          </div>
                        )}
                        {eventDetails.strVenue && (
                          <div className="flex items-start gap-2 p-3 bg-muted/40 rounded-lg">
                            <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                            <div>
                              <span className="text-muted-foreground block text-[10px] uppercase tracking-wide">
                                Stade
                              </span>
                              <span className="font-semibold">{eventDetails.strVenue}</span>
                            </div>
                          </div>
                        )}
                        {eventDetails.strSeason && (
                          <div className="flex items-start gap-2 p-3 bg-muted/40 rounded-lg">
                            <Calendar className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                            <div>
                              <span className="text-muted-foreground block text-[10px] uppercase tracking-wide">
                                Saison
                              </span>
                              <span className="font-semibold">{eventDetails.strSeason}</span>
                            </div>
                          </div>
                        )}
                        {eventDetails.intRound && (
                          <div className="flex items-start gap-2 p-3 bg-muted/40 rounded-lg">
                            <Target className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                            <div>
                              <span className="text-muted-foreground block text-[10px] uppercase tracking-wide">
                                Tour
                              </span>
                              <span className="font-semibold">Journée {eventDetails.intRound}</span>
                            </div>
                          </div>
                        )}
                        {eventDetails.intSpectators && Number.parseInt(eventDetails.intSpectators) > 0 && (
                          <div className="flex items-start gap-2 p-3 bg-muted/40 rounded-lg">
                            <Users className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                            <div>
                              <span className="text-muted-foreground block text-[10px] uppercase tracking-wide">
                                Spectateurs
                              </span>
                              <span className="font-semibold">
                                {Number.parseInt(eventDetails.intSpectators).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        )}
                        {eventDetails.strCity && (
                          <div className="flex items-start gap-2 p-3 bg-muted/40 rounded-lg">
                            <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                            <div>
                              <span className="text-muted-foreground block text-[10px] uppercase tracking-wide">
                                Ville
                              </span>
                              <span className="font-semibold">{eventDetails.strCity}</span>
                            </div>
                          </div>
                        )}
                        {eventDetails.strCountry && (
                          <div className="flex items-start gap-2 p-3 bg-muted/40 rounded-lg">
                            <Globe className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                            <div>
                              <span className="text-muted-foreground block text-[10px] uppercase tracking-wide">
                                Pays
                              </span>
                              <span className="font-semibold">{eventDetails.strCountry}</span>
                            </div>
                          </div>
                        )}
                        {eventDetails.strStatus && (
                          <div className="flex items-start gap-2 p-3 bg-muted/40 rounded-lg">
                            <Info className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                            <div>
                              <span className="text-muted-foreground block text-[10px] uppercase tracking-wide">
                                Statut
                              </span>
                              <span className="font-semibold capitalize">{eventDetails.strStatus}</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {eventDetails.strDescriptionEN && (
                        <div className="p-3 bg-muted/30 rounded-lg border border-border">
                          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                            {eventDetails.strDescriptionEN}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Statistics */}
                  {stats.length > 0 && (
                    <div className="space-y-2 pt-3 border-t border-border">
                      <h4 className="font-semibold text-sm flex items-center gap-2">
                        <Signal className="w-4 h-4 text-primary" />
                        Statistiques
                      </h4>
                      <div className="space-y-1.5">
                        {stats.slice(0, 10).map((stat: any, idx: number) => (
                          <div
                            key={idx}
                            className="flex justify-between items-center text-xs p-1.5 bg-muted/20 rounded"
                          >
                            <span className="font-medium w-12 text-right">{stat.intHome || "-"}</span>
                            <span className="text-muted-foreground flex-1 text-center text-[10px]">{stat.strStat}</span>
                            <span className="font-medium w-12">{stat.intAway || "-"}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Timeline */}
                  {timeline.length > 0 && (
                    <div className="space-y-2 pt-3 border-t border-border">
                      <h4 className="font-semibold text-sm flex items-center gap-2">
                        <Clock className="w-4 h-4 text-primary" />
                        Chronologie
                      </h4>
                      <div className="space-y-1 max-h-40 overflow-y-auto">
                        {timeline.map((event: any, idx: number) => (
                          <div key={idx} className="flex items-start gap-2 text-xs p-1.5 bg-muted/20 rounded">
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 flex-shrink-0">
                              {event.intTime}'
                            </Badge>
                            <div className="flex-1 min-w-0">
                              <span className="font-medium block truncate">{event.strTimeline}</span>
                              {event.strPlayer && (
                                <span className="text-muted-foreground text-[10px]">{event.strPlayer}</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Lineup */}
                  {lineup.length > 0 && (
                    <div className="space-y-2 pt-3 border-t border-border">
                      <h4 className="font-semibold text-sm flex items-center gap-2">
                        <Users className="w-4 h-4 text-primary" />
                        Compositions ({homeFormation} vs {awayFormation})
                      </h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <h5 className="text-[10px] font-medium text-muted-foreground">{homeName}</h5>
                          {homeLineup.slice(0, 11).map((player, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between p-1 bg-muted/20 rounded text-[10px]"
                            >
                              <div className="flex items-center gap-1">
                                <span className="font-mono text-muted-foreground w-4">
                                  {player.intSquadNumber || idx + 1}
                                </span>
                                <span className="font-medium truncate max-w-[80px]">{player.strPlayer}</span>
                              </div>
                              {player.strPosition && (
                                <Badge variant="outline" className="text-[8px] px-1 py-0">
                                  {player.strPosition}
                                </Badge>
                              )}
                            </div>
                          ))}
                        </div>
                        <div className="space-y-1">
                          <h5 className="text-[10px] font-medium text-muted-foreground">{awayName}</h5>
                          {awayLineup.slice(0, 11).map((player, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between p-1 bg-muted/20 rounded text-[10px]"
                            >
                              <div className="flex items-center gap-1">
                                <span className="font-mono text-muted-foreground w-4">
                                  {player.intSquadNumber || idx + 1}
                                </span>
                                <span className="font-medium truncate max-w-[80px]">{player.strPlayer}</span>
                              </div>
                              {player.strPosition && (
                                <Badge variant="outline" className="text-[8px] px-1 py-0">
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
                    <div className="space-y-2 pt-3 border-t border-border">
                      <h4 className="font-semibold text-sm flex items-center gap-2">
                        <Tv className="w-4 h-4 text-primary" />
                        Diffusions TV ({tvBroadcasts.length})
                      </h4>
                      <div className="grid grid-cols-2 gap-1.5">
                        {tvBroadcasts.map((broadcast: any, idx: number) => (
                          <div key={idx} className="flex items-center gap-2 p-1.5 bg-muted/20 rounded text-xs">
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">{broadcast.strChannel}</div>
                              {broadcast.strCountry && (
                                <div className="text-[10px] text-muted-foreground">{broadcast.strCountry}</div>
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
                      <div className="text-center py-6 text-muted-foreground">
                        <Signal className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Aucune information supplémentaire disponible</p>
                      </div>
                    )}

                  {loadingDetails && (
                    <div className="text-center py-6">
                      <Loader2 className="w-6 h-6 mx-auto mb-2 animate-spin text-primary" />
                      <p className="text-xs text-muted-foreground">Chargement des détails...</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Betting panel - positioned absolutely on the right on large screens */}
            {bettingAllowed && showBetting && (
              <div className="lg:fixed lg:right-4 lg:top-[120px] lg:bottom-4 lg:w-[400px] mt-4 lg:mt-0">
                <div className="bg-card border border-border rounded-lg p-4 h-full lg:overflow-y-auto">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-base font-bold flex items-center gap-2">
                      <Signal className="w-4 h-4 text-primary" />
                      Paris rapide
                    </h3>
                    <Button variant="ghost" size="sm" onClick={() => setShowBetting(false)} className="h-8 w-8 p-0">
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <BettingPanel match={match} compact />
                </div>
              </div>
            )}

            {/* Show betting button */}
            {bettingAllowed && !showBetting && (
              <div className="fixed bottom-4 right-4 z-50">
                <Button
                  onClick={() => setShowBetting(true)}
                  className="bg-amber-500 hover:bg-amber-600 text-white shadow-lg"
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Afficher les paris
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
