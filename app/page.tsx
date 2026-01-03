"use client"

import type React from "react"

import { useState, useEffect, useCallback, useMemo } from "react"
import type { Match } from "@/types/match"
import { getMatches, getSports, SPORT_ICONS, SPORT_COLORS } from "@/lib/api"
import { getFavorites } from "@/lib/storage"
import { usePullRefresh } from "@/hooks/use-pull-refresh"
import { generateTotalViewers, formatViewers } from "@/lib/viewers"
import { batchEnrichMatches } from "@/lib/match-enrichment"
import { BettingLeaderboard } from "@/components/betting-leaderboard"
import { CalendarView } from "@/components/calendar-view"

import { HeroSection } from "@/components/hero-section"
import { MatchCard } from "@/components/match-card"
import { SportCard } from "@/components/sport-card"
import { Carousel } from "@/components/carousel"
import { BottomNavigation } from "@/components/bottom-navigation"
import { StreamModal } from "@/components/stream-modal"
import { SkeletonCard, SkeletonSportCard } from "@/components/skeleton-card"
import { PullRefreshIndicator } from "@/components/pull-refresh-indicator"
import { MiniGame } from "@/components/mini-game"
import { HistorySection } from "@/components/history-section"
import { NotificationContainer, type NotificationType } from "@/components/notification"
import { NotificationsPanel } from "@/components/notifications-panel"
import { MatchDetailsModal } from "@/components/match-details-modal"
import { Footer } from "@/components/footer"

import { Search, X, ChevronUp, Play, Users, Bell, Eye } from "lucide-react"
import { cn } from "@/lib/utils"
import { getUnreadNotificationsCount } from "@/lib/storage"

const AD_URLS = [
  "https://foreignabnormality.com/c6hhrkarxp?key=e92078d07ea567d3f06d271967492752",
  "https://otieu.com/4/10323906",
]

interface Notification {
  id: string
  type: NotificationType
  title: string
  message?: string
  onClick?: () => void // Add onClick for ad notifications
}

export default function HomePage() {
  // State
  const [matches, setMatches] = useState<Match[]>([])
  const [sports, setSports] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null)
  const [activeTab, setActiveTab] = useState("home")
  const [searchQuery, setSearchQuery] = useState("")
  const [showSearch, setShowSearch] = useState(false)
  const [showScrollTop, setShowScrollTop] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [selectedSport, setSelectedSport] = useState<string | null>(null)
  const [totalViewers, setTotalViewers] = useState(0)
  const [showNotifications, setShowNotifications] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [showMatchDetails, setShowMatchDetails] = useState(false)
  const [detailsMatch, setDetailsMatch] = useState<Match | null>(null)
  const [favoritesUpdateTrigger, setFavoritesUpdateTrigger] = useState(0)
  const [filteredMatches, setFilteredMatches] = useState<Match[]>([])

  // Notifications
  const addNotification = (type: NotificationType, title: string, message?: string) => {
    const id = Date.now().toString()
    setNotifications((prev) => [...prev, { id, type, title, message }])
  }

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }, [])

  // Theme toggle
  const toggleTheme = () => {
    const newTheme = document.documentElement.classList.toggle("dark")
    document.documentElement.classList.toggle("light", !newTheme)
  }

  // Computed data
  const featuredMatch = useMemo(() => matches.find((m) => m.popular) || matches[0], [matches])

  const popularMatches = useMemo(() => matches.filter((m) => m.popular).slice(0, 12), [matches])

  const liveMatches = useMemo(() => {
    const now = Date.now() / 1000
    return matches.filter((m) => m.date / 1000 <= now && m.date / 1000 >= now - 7200)
  }, [matches])

  const matchesBySport = useMemo(() => {
    const grouped: Record<string, Match[]> = {}
    matches.forEach((m) => {
      const sport = m.sport_name || "Other"
      if (!grouped[sport]) grouped[sport] = []
      grouped[sport].push(m)
    })
    return grouped
  }, [matches])

  const sportStats = useMemo(() => {
    const stats: Record<string, number> = {}
    matches.forEach((m) => {
      const sport = m.sport_name || "Other"
      stats[sport] = (stats[sport] || 0) + 1
    })

    console.log("[v0] Sport statistics:", stats)

    return stats
  }, [matches])

  const currentFavorites = useMemo(() => {
    const favIds = getFavorites()
    console.log("[v0] Favorites updated:", { count: favIds.length, ids: favIds })
    const filtered = matches.filter((m) => favIds.includes(m.id))
    console.log("[v0] Filtered favorites matches:", { count: filtered.length, matchIds: filtered.map((m) => m.id) })
    return filtered
  }, [matches, favoritesUpdateTrigger])

  // Handle match click
  const handleMatchClick = (match: Match) => {
    setSelectedMatch(match)
  }

  // Handle match click by ID (for history)
  const handleMatchClickById = (matchId: string) => {
    const match = matches.find((m) => m.id === matchId)
    if (match) {
      setSelectedMatch(match)
    }
  }

  const handleMatchDetails = (match: Match, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    setDetailsMatch(match)
    setShowMatchDetails(true)
  }

  // Sport order
  const sportOrder = [
    "Football",
    "Basketball",
    "American Football",
    "Hockey",
    "Baseball",
    "Tennis",
    "Motor Sports",
    "Fight",
    "Rugby",
    "Golf",
    "Cricket",
    "Billiards",
    "AFL",
    "Darts",
    "Other",
  ]

  // Get current content based on tab
  const renderContent = () => {
    if (loading) {
      return (
        <div className="space-y-12 py-8">
          {/* Loading skeleton */}
          <section>
            <div className="section-header flex justify-between items-center mb-6 px-4 md:px-0">
              <div className="h-8 w-48 bg-muted rounded animate-pulse" />
            </div>
            <Carousel>
              {[...Array(5)].map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </Carousel>
          </section>
          <section>
            <div className="section-header flex justify-between items-center mb-6 px-4 md:px-0">
              <div className="h-8 w-40 bg-muted rounded animate-pulse" />
            </div>
            <Carousel>
              {[...Array(8)].map((_, i) => (
                <SkeletonSportCard key={i} />
              ))}
            </Carousel>
          </section>
          {/* Mini game while loading */}
          <div className="py-8">
            <MiniGame />
          </div>
        </div>
      )
    }

    switch (activeTab) {
      case "live":
        return (
          <section className="py-8">
            <div className="flex items-center gap-3 mb-6 px-4 md:px-0">
              <h2 className="text-2xl font-black flex items-center gap-3">
                <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                En Direct
              </h2>
              <span className="text-muted-foreground">({liveMatches.length})</span>
            </div>
            {liveMatches.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 px-4 md:px-0">
                {liveMatches.map((match, index) => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    onClick={() => handleMatchClick(match)}
                    onDetails={() => handleMatchDetails(match)}
                    index={index}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <Play className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
                <h3 className="text-xl font-bold mb-2">Aucun match en direct</h3>
                <p className="text-muted-foreground">Revenez plus tard pour les matchs live !</p>
              </div>
            )}
          </section>
        )

      case "favorites":
        return (
          <section className="py-8 px-4 md:px-0">
            <div className="flex items-center gap-3 mb-6">
              <h2 className="text-2xl font-black">💖 Mes Favoris</h2>
              <span className="text-muted-foreground">({currentFavorites.length})</span>
            </div>
            {currentFavorites.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {currentFavorites.map((match, index) => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    onClick={() => handleMatchClick(match)}
                    onDetails={() => handleMatchDetails(match)}
                    index={index}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-muted/20 rounded-xl border-2 border-dashed border-border">
                <span className="text-6xl mb-4 block">💔</span>
                <h3 className="text-xl font-bold mb-2">Aucun favori</h3>
                <p className="text-muted-foreground mb-4">
                  Cliquez sur le coeur d'un match pour l'ajouter à vos favoris
                </p>
                <button
                  onClick={() => setActiveTab("home")}
                  className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors"
                  type="button"
                >
                  Découvrir les matchs
                </button>
              </div>
            )}
          </section>
        )

      case "history":
        return (
          <section className="py-8 px-4 md:px-0">
            <HistorySection onMatchClick={handleMatchClickById} />
          </section>
        )

      case "calendar":
        return <CalendarView />

      default:
        // Home
        return (
          <>
            {/* Hero */}
            {featuredMatch && <HeroSection match={featuredMatch} onClick={() => handleMatchClick(featuredMatch)} />}

            <div className="space-y-12 py-8">
              {/* Popular Matches Section */}
              {popularMatches.length > 0 && (
                <section>
                  <div className="flex items-center justify-between mb-6 px-4 md:px-0">
                    <h2 className="text-xl md:text-2xl font-black flex items-center gap-3">🔥 Matchs populaires</h2>
                  </div>

                  <Carousel>
                    {popularMatches.map((match, index) => (
                      <MatchCard
                        key={match.id}
                        match={match}
                        onClick={() => handleMatchClick(match)}
                        onDetails={() => handleMatchDetails(match)}
                        index={index}
                      />
                    ))}
                  </Carousel>
                </section>
              )}

              {/* Sports Cards */}
              <section>
                <div className="flex items-center justify-between mb-6 px-4 md:px-0">
                  <h2 className="text-xl md:text-2xl font-black flex items-center gap-3">🏅 Parcourir par sport</h2>
                </div>
                <Carousel>
                  {sportOrder.map((sportName, index) => {
                    const count = sportStats[sportName] || 0
                    return (
                      <SportCard
                        key={sportName}
                        name={sportName}
                        count={count}
                        onClick={() => {
                          setSelectedSport(sportName)
                          setActiveTab("sport")
                        }}
                        index={index}
                      />
                    )
                  })}
                </Carousel>
              </section>

              {/* Popular */}
              {sportOrder.map((sportName) => {
                const sportMatches = matchesBySport[sportName]
                if (!sportMatches || sportMatches.length === 0) return null

                return (
                  <section key={sportName}>
                    <div className="flex items-center justify-between mb-6 px-4 md:px-0">
                      <h2 className="text-xl font-bold flex items-center gap-2">
                        {SPORT_ICONS[sportName] || "🏅"} {sportName}
                      </h2>
                      <button
                        onClick={() => {
                          setSelectedSport(sportName)
                          setActiveTab("sport")
                        }}
                        className="text-sm text-primary hover:underline"
                      >
                        Voir tout ({sportMatches.length})
                      </button>
                    </div>
                    <Carousel>
                      {sportMatches.slice(0, 12).map((match, index) => (
                        <MatchCard
                          key={match.id}
                          match={match}
                          onClick={() => handleMatchClick(match)}
                          onDetails={() => handleMatchDetails(match)}
                          index={index}
                        />
                      ))}
                    </Carousel>
                  </section>
                )
              })}

              {/* Leaderboard Section */}
              <section className="px-4 md:px-0">
                <BettingLeaderboard />
              </section>
            </div>
          </>
        )
    }
  }

  // Sport tab content
  const renderSportContent = () => {
    if (!selectedSport || activeTab !== "sport") return null

    const sportMatches = matchesBySport[selectedSport] || []
    const colors = SPORT_COLORS[selectedSport] || SPORT_COLORS.default

    return (
      <section className="py-8">
        <button
          onClick={() => setActiveTab("home")}
          className="mb-6 px-4 md:px-0 text-primary rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
        >
          ← Retour
        </button>

        <div className="flex items-center justify-between mb-6 px-4 md:px-0">
          <h2 className="text-2xl font-black flex items-center gap-3" style={{ color: colors.primary }}>
            {SPORT_ICONS[selectedSport] || "🏅"} {selectedSport}
          </h2>
          <span className="text-muted-foreground">({sportMatches.length} matchs)</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 px-4 md:px-0">
          {sportMatches.map((match, index) => (
            <MatchCard
              key={match.id}
              match={match}
              onClick={() => handleMatchClick(match)}
              onDetails={() => handleMatchDetails(match)}
              index={index}
            />
          ))}
        </div>
      </section>
    )
  }

  useEffect(() => {
    const filtered = matches.filter(
      (match) =>
        match.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        match.teams.home.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        match.teams.away.name?.toLowerCase().includes(searchQuery.toLowerCase()),
    )
    setFilteredMatches(filtered)
  }, [matches, searchQuery])

  const showSupportNotification = useCallback(() => {
    const messages = [
      { title: "Soutenez notre site ! 💚", message: "Cliquez ici pour nous aider (ouvrez et refermez la pub)" },
      { title: "Aidez-nous à rester gratuit ! 🙏", message: "Un clic = un grand merci de notre part !" },
      { title: "Un petit coup de pouce ? 💪", message: "Votre soutien nous aide à continuer" },
      { title: "Supportez Sports-Stream ! ⚡", message: "Gardons ce service gratuit ensemble" },
    ]
    const msg = messages[Math.floor(Math.random() * messages.length)]

    const id = Date.now().toString()
    setNotifications((prev) => [
      ...prev,
      {
        id,
        type: "ad" as NotificationType,
        title: msg.title,
        message: msg.message,
        onClick: () => {
          const adUrl = AD_URLS[Math.floor(Math.random() * AD_URLS.length)]
          window.open(adUrl, "_blank")
          addNotification("success", "Merci pour votre soutien ! 💖", "Votre aide nous est précieuse")
        },
      },
    ])

    // Auto-close after 20 seconds for users to have time to see it
    setTimeout(() => {
      removeNotification(id)
    }, 20000)
  }, [removeNotification])

  // Initial load
  const loadData = async () => {
    setLoading(true)
    try {
      const [matchesData, sportsData] = await Promise.all([getMatches(), getSports()])

      console.log("[v0] Total matches loaded:", matchesData.length)

      setMatches(matchesData)
      setSports(sportsData)
      addNotification("success", "Bienvenue ! 🎉", "Profitez de tous vos matchs en direct")

      const popularMatches = matchesData.filter((m) => m.popular).slice(0, 20)
      batchEnrichMatches(popularMatches).then((enrichedMatches) => {
        console.log("[v0] Popular matches enriched with scores")
        setMatches((prev) =>
          prev.map((match) => {
            const enriched = enrichedMatches.find((em) => em.id === match.id)
            return enriched || match
          }),
        )
      })
    } catch (error) {
      console.error("Error loading data:", error)
      addNotification("error", "Erreur de chargement", "Impossible de charger les données")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    setTotalViewers(generateTotalViewers())
    setUnreadCount(getUnreadNotificationsCount())

    setTimeout(() => {
      addNotification(
        "reminder",
        "⚠️ PARIS FICTIFS UNIQUEMENT",
        "Cette plateforme utilise uniquement de l'argent virtuel. Aucun pari réel n'est effectué.",
      )
    }, 2000)

    let supportNotifTimer: NodeJS.Timeout | null = null

    const scheduleNextSupportNotif = () => {
      // Clear any existing timer first
      if (supportNotifTimer) {
        clearTimeout(supportNotifTimer)
      }
      // Schedule next notification between 8-12 minutes
      const delay = (Math.random() * 4 + 8) * 60 * 1000
      supportNotifTimer = setTimeout(() => {
        showSupportNotification()
        // Schedule the next one after this one completes
        scheduleNextSupportNotif()
      }, delay)
    }

    // First support notification after 5 minutes
    const firstNotifTimer = setTimeout(
      () => {
        showSupportNotification()
        // Only schedule next notifications after the first one completes
        scheduleNextSupportNotif()
      },
      5 * 60 * 1000,
    )

    const interval = setInterval(() => {
      setTotalViewers(generateTotalViewers())
      setUnreadCount(getUnreadNotificationsCount())
    }, 10000)

    return () => {
      clearInterval(interval)
      clearTimeout(firstNotifTimer)
      if (supportNotifTimer) {
        clearTimeout(supportNotifTimer)
      }
    }
  }, [showSupportNotification])

  useEffect(() => {
    // Import and start bet validation
    import("@/lib/bet-validation").then(({ validateAllPendingBets }) => {
      // Initial validation
      validateAllPendingBets()

      // Set up periodic validation every 2 minutes
      const interval = setInterval(() => {
        validateAllPendingBets()
      }, 120000)

      return () => clearInterval(interval)
    })
  }, [])

  useEffect(() => {
    const handleFavoriteChange = () => {
      console.log("[v0] Favorites list updated")
      setFavoritesUpdateTrigger((prev) => prev + 1)
    }

    window.addEventListener("favoriteToggled", handleFavoriteChange)
    // Trigger initial update after mount
    handleFavoriteChange()

    return () => window.removeEventListener("favoriteToggled", handleFavoriteChange)
  }, [])

  // Scroll listener
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 500)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Pull to refresh
  const {
    pullDistance,
    isRefreshing,
    handlers: pullHandlers,
  } = usePullRefresh({
    onRefresh: async () => {
      await loadData()
      addNotification("success", "Actualisé !", "Les données ont été mises à jour")
    },
  })

  return (
    <div className="min-h-screen bg-background text-foreground" {...pullHandlers}>
      {/* Pull to refresh indicator */}
      <PullRefreshIndicator pullDistance={pullDistance} isRefreshing={isRefreshing} />

      {/* Notifications */}
      <NotificationContainer notifications={notifications} onClose={removeNotification} />

      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-border">
        <nav className="max-w-[1920px] mx-auto px-4 md:px-8 py-3 md:py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Logo */}
            <a href="/" className="flex items-center gap-3 group">
              <img
                src="https://i.ibb.co/wZnzLfmv/minisports-stream-logo-removebg-preview.png"
                alt="Sports-Stream"
                className="h-12 md:h-16 w-auto transition-transform group-hover:scale-105"
              />
            </a>

            {/* Desktop Nav */}
            <ul className="hidden lg:flex items-center gap-2">
              {[
                { id: "home", icon: "📺", label: "Tous" },
                { id: "live", icon: "🔴", label: "En Direct", count: liveMatches.length },
                { id: "calendar", icon: "📅", label: "Calendrier" },
              ].map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => setActiveTab(item.id)}
                    className={cn(
                      "px-4 py-2 rounded-lg font-semibold text-sm transition-all relative",
                      activeTab === item.id
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted",
                    )}
                  >
                    {item.icon} {item.label}
                    {item.count !== undefined && item.count > 0 && (
                      <span className="ml-2 px-2 py-0.5 text-[10px] font-bold bg-red-500 text-white rounded-full animate-pulse">
                        {item.count}
                      </span>
                    )}
                  </button>
                </li>
              ))}
              <li>
                <a
                  href="/profile"
                  className="px-4 py-2 rounded-lg font-semibold text-sm transition-all text-muted-foreground hover:text-foreground hover:bg-muted flex items-center gap-2"
                >
                  👤 Ma Page
                </a>
              </li>
            </ul>

            <div className="hidden md:flex items-center gap-4 px-5 py-2.5 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-full">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-green-500" />
                <span className="font-bold text-green-500">{formatViewers(totalViewers)}</span>
                <span className="text-sm text-muted-foreground">en ligne</span>
              </div>
              <div className="w-px h-4 bg-border" />
              <div className="flex items-center gap-2">
                <span className="text-red-500 font-bold animate-pulse">🔴 {liveMatches.length}</span>
                <span className="text-sm text-muted-foreground">Live</span>
              </div>
              <div className="w-px h-4 bg-border" />
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-blue-500" />
                <span className="font-bold text-blue-500">{matches.length}</span>
                <span className="text-sm text-muted-foreground">Matchs</span>
              </div>
            </div>

            {/* Search */}
            <div className="flex items-center gap-3">
              {/* Notification button */}
              <button
                onClick={() => setShowNotifications(true)}
                className="p-2.5 rounded-lg bg-card border border-border hover:bg-muted transition-colors relative"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              <div className={cn("relative", showSearch && "flex-1 md:flex-none")}>
                {showSearch ? (
                  <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-2 w-full md:w-64">
                    <Search className="w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Rechercher..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="flex-1 bg-transparent outline-none text-sm"
                      autoFocus
                    />
                    <button onClick={() => setShowSearch(false)}>
                      <X className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowSearch(true)}
                    className="p-2.5 rounded-lg bg-card border border-border hover:bg-muted transition-colors"
                  >
                    <Search className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="max-w-[1920px] mx-auto md:px-8 pb-24 md:pb-8">
        {searchQuery ? (
          <section className="py-8 px-4 md:px-0">
            <div className="flex items-center gap-3 mb-6">
              <h2 className="text-xl font-bold">Résultats pour "{searchQuery}"</h2>
              <span className="text-muted-foreground">({filteredMatches.length})</span>
            </div>
            {filteredMatches.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredMatches.map((match, index) => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    onClick={() => handleMatchClick(match)}
                    onDetails={() => handleMatchDetails(match)}
                    index={index}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <Search className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
                <h3 className="text-xl font-bold mb-2">Aucun résultat</h3>
                <p className="text-muted-foreground">Essayez avec d'autres mots-clés</p>
              </div>
            )}
          </section>
        ) : activeTab === "sport" ? (
          renderSportContent()
        ) : (
          renderContent()
        )}
      </main>

      {/* Scroll to top */}
      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-20 md:bottom-8 right-4 z-40 w-12 h-12 bg-primary rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
        >
          <ChevronUp className="w-6 h-6 text-primary-foreground" />
        </button>
      )}

      {/* Bottom Navigation */}
      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Stream Modal - controlled by selectedMatch */}
      {selectedMatch && <StreamModal match={selectedMatch} onClose={() => setSelectedMatch(null)} />}

      {/* Match Details Modal - Fix open prop */}
      {showMatchDetails && detailsMatch && (
        <MatchDetailsModal match={detailsMatch} open={showMatchDetails} onClose={() => setShowMatchDetails(false)} />
      )}

      {/* Notifications Panel */}
      <NotificationsPanel isOpen={showNotifications} onClose={() => setShowNotifications(false)} />

      {/* Footer */}
      <Footer />
    </div>
  )
}
