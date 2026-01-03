"use client"

import { useState, useEffect } from "react"
import { Heart, TrendingUp, Trophy, Clock, ArrowLeft, Gift, ExternalLink, User, Edit2, Check, X } from "lucide-react"
import { useRouter } from "next/navigation"
import type { Match } from "@/types/match"
import { getMatches } from "@/lib/api"
import { MatchCard } from "@/components/match-card"
import {
  getFavorites,
  getBets,
  getBettingStats,
  getHistory,
  getBettingBalance,
  setBettingBalance,
  addNotification,
  getUsername,
  setUsername,
  canClaimDailyBonus,
  claimDailyBonus,
  getNextDailyBonusTime,
} from "@/lib/storage"
import { validatePendingBets } from "@/lib/bet-validator"
import { cn } from "@/lib/utils"

const AD_URL = "https://foreignabnormality.com/c6hhrkarxp?key=e92078d07ea567d3f06d271967492752"
const AD_REWARD = 100
const AD_LIMIT_KEY = "sports-stream-ad-limit"
const AD_LIMIT_COUNT = 3
const AD_LIMIT_DURATION = 60 * 60 * 1000 // 1 hour

export default function ProfilePage() {
  const router = useRouter()
  const [favorites, setFavorites] = useState<string[]>([])
  const [allMatches, setAllMatches] = useState<Match[]>([])
  const [favoriteMatches, setFavoriteMatches] = useState<Match[]>([])
  const [loadingMatches, setLoadingMatches] = useState(false)
  const [bets, setBets] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [history, setHistory] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<"bets" | "favorites" | "history">("bets")
  const [isWatchingAd, setIsWatchingAd] = useState(false)
  const [remainingAdViews, setRemainingAdViews] = useState(AD_LIMIT_COUNT)
  const [username, setUsernameState] = useState("")
  const [isEditingUsername, setIsEditingUsername] = useState(false)
  const [tempUsername, setTempUsername] = useState("")
  const [isValidatingBets, setIsValidatingBets] = useState(false)
  const [canClaimBonus, setCanClaimBonus] = useState(false)
  const [nextBonusTime, setNextBonusTime] = useState<number | null>(null)
  const [isClaimingBonus, setIsClaimingBonus] = useState(false)

  useEffect(() => {
    const loadMatchesData = async () => {
      setLoadingMatches(true)
      try {
        const matches = await getMatches()
        setAllMatches(matches)

        const favIds = getFavorites()
        const favMatches = matches.filter((m) => favIds.includes(m.id))
        setFavoriteMatches(favMatches)
      } catch (error) {
        console.error("[v0] Error loading matches:", error)
      } finally {
        setLoadingMatches(false)
      }
    }

    loadMatchesData()
  }, [])

  useEffect(() => {
    setFavorites(getFavorites())
    setBets(getBets())
    setStats(getBettingStats())
    setHistory(getHistory())
    checkAdLimit()
    setUsernameState(getUsername())
    console.log("[v0] Profile page mounted, starting bet validation")
    validateBets()
    checkDailyBonus()
  }, [])

  useEffect(() => {
    const handleFavoriteChange = () => {
      const favIds = getFavorites()
      setFavorites(favIds)
      const favMatches = allMatches.filter((m) => favIds.includes(m.id))
      setFavoriteMatches(favMatches)
    }

    window.addEventListener("favoriteToggled", handleFavoriteChange)
    window.addEventListener("storage", handleFavoriteChange)

    return () => {
      window.removeEventListener("favoriteToggled", handleFavoriteChange)
      window.removeEventListener("storage", handleFavoriteChange)
    }
  }, [allMatches])

  const checkAdLimit = () => {
    if (typeof window === "undefined") return

    const limitData = localStorage.getItem(AD_LIMIT_KEY)
    if (!limitData) {
      setRemainingAdViews(AD_LIMIT_COUNT)
      return
    }

    try {
      const { count, timestamp } = JSON.parse(limitData)
      const now = Date.now()

      if (now - timestamp > AD_LIMIT_DURATION) {
        localStorage.removeItem(AD_LIMIT_KEY)
        setRemainingAdViews(AD_LIMIT_COUNT)
      } else {
        setRemainingAdViews(Math.max(0, AD_LIMIT_COUNT - count))
      }
    } catch {
      setRemainingAdViews(AD_LIMIT_COUNT)
    }
  }

  const handleWatchAd = () => {
    if (remainingAdViews <= 0) {
      addNotification({
        type: "error",
        title: "Limite atteinte",
        message: "Vous avez atteint la limite de 3 publicités par heure",
      })
      return
    }

    setIsWatchingAd(true)
    window.open(AD_URL, "_blank")

    setTimeout(() => {
      const currentBalance = getBettingBalance()
      setBettingBalance(currentBalance + AD_REWARD)

      const limitData = localStorage.getItem(AD_LIMIT_KEY)
      if (limitData) {
        const { count, timestamp } = JSON.parse(limitData)
        localStorage.setItem(AD_LIMIT_KEY, JSON.stringify({ count: count + 1, timestamp }))
      } else {
        localStorage.setItem(AD_LIMIT_KEY, JSON.stringify({ count: 1, timestamp: Date.now() }))
      }

      addNotification({
        type: "success",
        title: "Récompense gagnée !",
        message: `+${AD_REWARD} points pour avoir regardé une publicité`,
      })

      setStats(getBettingStats())
      setIsWatchingAd(false)
      checkAdLimit()
    }, 2000)
  }

  const handleEditUsername = () => {
    setTempUsername(username)
    setIsEditingUsername(true)
  }

  const handleSaveUsername = () => {
    const trimmed = tempUsername.trim()
    if (trimmed.length >= 3 && trimmed.length <= 20) {
      setUsername(trimmed)
      setUsernameState(trimmed)
      setIsEditingUsername(false)
      addNotification({
        type: "success",
        title: "Pseudo enregistré",
        message: `Votre pseudo est maintenant: ${trimmed}`,
      })
    } else {
      addNotification({
        type: "error",
        title: "Erreur",
        message: "Le pseudo doit contenir entre 3 et 20 caractères",
      })
    }
  }

  const handleCancelEdit = () => {
    setIsEditingUsername(false)
    setTempUsername("")
  }

  const validateBets = async () => {
    console.log("[v0] validateBets function called")
    setIsValidatingBets(true)
    try {
      console.log("[v0] Calling validatePendingBets()")
      const results = await validatePendingBets()
      console.log("[v0] validatePendingBets completed with results:", results)

      if (results.length > 0) {
        console.log(`[v0] Validated ${results.length} bet(s), refreshing UI`)
        setBets(getBets())
        setStats(getBettingStats())
      } else {
        console.log("[v0] No bets were validated")
      }
    } catch (error) {
      console.error("[v0] Error validating bets:", error)
    } finally {
      setIsValidatingBets(false)
      console.log("[v0] Bet validation complete, isValidatingBets set to false")
    }
  }

  const checkDailyBonus = () => {
    setCanClaimBonus(canClaimDailyBonus())
    setNextBonusTime(getNextDailyBonusTime())
  }

  const handleClaimDailyBonus = () => {
    setIsClaimingBonus(true)

    const result = claimDailyBonus()

    if (result.success) {
      addNotification({
        type: "success",
        title: "Bonus quotidien réclamé !",
        message: `+${result.amount} points ajoutés à votre solde`,
      })
      setStats(getBettingStats())
      setCanClaimBonus(false)
      setNextBonusTime(result.nextClaimTime)
    } else {
      addNotification({
        type: "error",
        title: "Bonus déjà réclamé",
        message: "Vous avez déjà réclamé votre bonus quotidien aujourd'hui",
      })
    }

    setIsClaimingBonus(false)
  }

  const getTimeUntilNextBonus = () => {
    if (!nextBonusTime) return null

    const now = Date.now()
    const diff = nextBonusTime - now

    if (diff <= 0) {
      checkDailyBonus()
      return null
    }

    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

    return `${hours}h ${minutes}m`
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-xl border-b border-border">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-muted">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-black">Ma Page</h1>
          {isValidatingBets && (
            <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              Vérification des paris...
            </div>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <div className="bg-gradient-to-br from-card via-card to-primary/5 border-2 border-primary/20 rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center">
              <User className="w-8 h-8 text-primary-foreground" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground mb-1">Votre pseudo</p>
              {isEditingUsername ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={tempUsername}
                    onChange={(e) => setTempUsername(e.target.value)}
                    className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-lg font-bold outline-none focus:border-primary"
                    placeholder="Entrez votre pseudo"
                    maxLength={20}
                    autoFocus
                  />
                  <button
                    onClick={handleSaveUsername}
                    className="p-2 rounded-lg bg-green-500 hover:bg-green-600 text-white transition-colors"
                  >
                    <Check className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="p-2 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-black">
                    {username || <span className="text-muted-foreground">Aucun pseudo</span>}
                  </h2>
                  <button
                    onClick={handleEditUsername}
                    className="p-2 rounded-lg hover:bg-muted transition-colors"
                    title="Modifier le pseudo"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              )}
              {!isEditingUsername && !username && (
                <p className="text-xs text-muted-foreground mt-1">Cliquez sur l'icône pour définir votre pseudo</p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-500/10 via-cyan-500/10 to-teal-500/10 border-2 border-blue-500/30 rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-cyan-500/20 to-teal-500/20 blur-3xl" />
          <div className="relative">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-black mb-1 flex items-center gap-2">
                  <Gift className="w-5 h-5 text-cyan-500" />
                  Bonus quotidien
                </h3>
                <p className="text-sm text-muted-foreground">Réclamez 200 points gratuits une fois par jour</p>
                {!canClaimBonus && nextBonusTime && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Prochain bonus dans: <span className="font-bold text-cyan-500">{getTimeUntilNextBonus()}</span>
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={handleClaimDailyBonus}
              disabled={!canClaimBonus || isClaimingBonus}
              className={cn(
                "w-full font-bold py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2",
                canClaimBonus
                  ? "bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white hover:shadow-lg hover:scale-105"
                  : "bg-muted text-muted-foreground cursor-not-allowed",
                "disabled:opacity-50 disabled:cursor-not-allowed",
              )}
            >
              {isClaimingBonus ? (
                "Réclamation..."
              ) : canClaimBonus ? (
                <>
                  <Gift className="w-4 h-4" />
                  Réclamer 200 points
                </>
              ) : (
                <>Déjà réclamé aujourd'hui</>
              )}
            </button>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-amber-500/10 border-2 border-purple-500/30 rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-500/20 to-pink-500/20 blur-3xl" />
          <div className="relative">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-black mb-1 flex items-center gap-2">
                  <Gift className="w-5 h-5 text-amber-500" />
                  Gagnez des points !
                </h3>
                <p className="text-sm text-muted-foreground">Regardez une publicité et gagnez {AD_REWARD} points</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Publicités restantes: <span className="font-bold text-amber-500">{remainingAdViews}/3</span> (se
                  réinitialise toutes les heures)
                </p>
              </div>
            </div>
            <button
              onClick={handleWatchAd}
              disabled={isWatchingAd || remainingAdViews <= 0}
              className={cn(
                "w-full font-bold py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2",
                remainingAdViews > 0
                  ? "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white hover:shadow-lg hover:scale-105"
                  : "bg-muted text-muted-foreground cursor-not-allowed",
                "disabled:opacity-50 disabled:cursor-not-allowed",
              )}
            >
              {isWatchingAd ? (
                "Chargement..."
              ) : remainingAdViews <= 0 ? (
                <>Limite atteinte (réessayez dans 1h)</>
              ) : (
                <>
                  <ExternalLink className="w-4 h-4" />
                  Voir la pub (+{AD_REWARD} pts)
                </>
              )}
            </button>
          </div>
        </div>

        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-xl p-4">
              <p className="text-xs text-muted-foreground mb-1">Solde</p>
              <p className="text-2xl font-black text-amber-500">{stats.balance}</p>
              <p className="text-xs text-muted-foreground">points</p>
            </div>
            <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl p-4">
              <p className="text-xs text-muted-foreground mb-1">Gains</p>
              <p className="text-2xl font-black text-green-500">{stats.totalWon.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">{stats.wonBets} paris</p>
            </div>
            <div className="bg-gradient-to-br from-red-500/10 to-rose-500/10 border border-red-500/20 rounded-xl p-4">
              <p className="text-xs text-muted-foreground mb-1">Pertes</p>
              <p className="text-2xl font-black text-red-500">{stats.totalLost.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">{stats.lostBets} paris</p>
            </div>
            <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-xl p-4">
              <p className="text-xs text-muted-foreground mb-1">Total</p>
              <p className="text-2xl font-black text-blue-500">{stats.totalBets}</p>
              <p className="text-xs text-muted-foreground">paris placés</p>
            </div>
          </div>
        )}

        <div className="flex gap-2 border-b border-border">
          <button
            onClick={() => setActiveTab("bets")}
            className={cn(
              "flex items-center gap-2 px-4 py-3 font-bold transition-all",
              activeTab === "bets" ? "text-primary border-b-2 border-primary" : "text-muted-foreground",
            )}
          >
            <TrendingUp className="w-4 h-4" />
            Paris ({bets.length})
          </button>
          <button
            onClick={() => setActiveTab("favorites")}
            className={cn(
              "flex items-center gap-2 px-4 py-3 font-bold transition-all",
              activeTab === "favorites" ? "text-primary border-b-2 border-primary" : "text-muted-foreground",
            )}
          >
            <Heart className="w-4 h-4" />
            Favoris ({favorites.length})
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={cn(
              "flex items-center gap-2 px-4 py-3 font-bold transition-all",
              activeTab === "history" ? "text-primary border-b-2 border-primary" : "text-muted-foreground",
            )}
          >
            <Clock className="w-4 h-4" />
            Historique ({history.length})
          </button>
        </div>

        {activeTab === "bets" && (
          <div className="space-y-3">
            {bets.length === 0 ? (
              <div className="text-center py-12">
                <TrendingUp className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">Aucun pari placé</p>
              </div>
            ) : (
              bets.map((bet) => (
                <div key={bet.id} className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-bold mb-1">{bet.matchTitle}</h3>
                      <p className="text-sm text-muted-foreground">{bet.sport}</p>
                    </div>
                    <div
                      className={cn(
                        "px-3 py-1 rounded-lg text-xs font-bold uppercase",
                        bet.status === "won" && "bg-green-500/20 text-green-500",
                        bet.status === "lost" && "bg-red-500/20 text-red-500",
                        bet.status === "pending" && "bg-amber-500/20 text-amber-500",
                      )}
                    >
                      {bet.status === "won" ? "Gagné" : bet.status === "lost" ? "Perdu" : "En attente"}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground text-xs">Pari</p>
                      <p className="font-bold">
                        {bet.betType === "home" ? "Domicile" : bet.betType === "away" ? "Extérieur" : "Nul"}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Mise</p>
                      <p className="font-bold">{bet.amount} pts</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Cote</p>
                      <p className="font-bold">{bet.odds}x</p>
                    </div>
                  </div>
                  {bet.status === "won" && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <p className="text-sm font-bold text-green-500">Gain: +{bet.winAmount.toFixed(2)} points</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "favorites" && (
          <div className="space-y-3">
            {loadingMatches ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-3" />
                <p className="text-muted-foreground">Chargement des favoris...</p>
              </div>
            ) : favoriteMatches.length === 0 ? (
              <div className="text-center py-12 bg-muted/20 rounded-xl border-2 border-dashed border-border">
                <Heart className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
                <h3 className="text-xl font-bold mb-2">Aucun favori</h3>
                <p className="text-xs text-muted-foreground mb-4">
                  Ajoutez des matchs à vos favoris depuis la page d'accueil
                </p>
                <button
                  onClick={() => router.push("/")}
                  className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors"
                  type="button"
                >
                  Découvrir les matchs
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {favoriteMatches.map((match, index) => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    onClick={() => router.push(`/?match=${match.id}`)}
                    onDetails={() => {}}
                    index={index}
                    animate={false}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "history" && (
          <div className="space-y-3">
            {history.length === 0 ? (
              <div className="text-center py-12">
                <Clock className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">Aucun historique</p>
              </div>
            ) : (
              history.map((item) => (
                <div key={item.matchId} className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <Trophy className="w-5 h-5 text-primary" />
                    <div className="flex-1">
                      <h3 className="font-bold text-sm">{item.title}</h3>
                      <p className="text-xs text-muted-foreground">{item.sport}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(item.timestamp).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
