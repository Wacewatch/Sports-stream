"use client"

const FAVORITES_KEY = "sports-stream-favorites"
const HISTORY_KEY = "sports-stream-history"
const THEME_KEY = "sports-stream-theme"
const SPORT_THEME_KEY = "sports-stream-sport-theme"
const BETS_KEY = "sports-stream-bets"
const BETTING_BALANCE_KEY = "sports-stream-balance"
const NOTIFICATIONS_KEY = "sports-stream-notifications"
const USERNAME_KEY = "sports-stream-username"
const USER_ID_KEY = "sports-stream-user-id"
const DAILY_BONUS_KEY = "sports-stream-daily-bonus"
const DAILY_BONUS_AMOUNT = 200

export function getFavorites(): string[] {
  if (typeof window === "undefined") return []
  try {
    return JSON.parse(localStorage.getItem(FAVORITES_KEY) || "[]")
  } catch {
    return []
  }
}

export function setFavorites(favorites: string[]) {
  if (typeof window === "undefined") return
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites))
}

export function toggleFavorite(matchId: string): boolean {
  const favorites = getFavorites()
  const index = favorites.indexOf(matchId)
  if (index > -1) {
    favorites.splice(index, 1)
    setFavorites(favorites)
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("favoriteToggled", { detail: { matchId, isFavorite: false } }))
    }
    return false
  } else {
    favorites.push(matchId)
    setFavorites(favorites)
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("favoriteToggled", { detail: { matchId, isFavorite: true } }))
    }
    return true
  }
}

export function isFavorite(matchId: string): boolean {
  return getFavorites().includes(matchId)
}

// Historique des matchs vus
export interface HistoryItem {
  matchId: string
  title: string
  timestamp: number
  sport: string
}

export function getHistory(): HistoryItem[] {
  if (typeof window === "undefined") return []
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]")
  } catch {
    return []
  }
}

export function addToHistory(item: Omit<HistoryItem, "timestamp">) {
  const history = getHistory()
  const existing = history.findIndex((h) => h.matchId === item.matchId)
  if (existing > -1) {
    history.splice(existing, 1)
  }
  history.unshift({ ...item, timestamp: Date.now() })
  // Garder seulement les 50 derniers
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 50)))
}

// Thème
export function getTheme(): "dark" | "light" {
  if (typeof window === "undefined") return "dark"
  return (localStorage.getItem(THEME_KEY) as "dark" | "light") || "dark"
}

export function setTheme(theme: "dark" | "light") {
  if (typeof window === "undefined") return
  localStorage.setItem(THEME_KEY, theme)
  document.documentElement.classList.toggle("dark", theme === "dark")
  document.documentElement.classList.toggle("light", theme === "light")
}

// Sport Theme
export function getSportTheme(): string {
  if (typeof window === "undefined") return "default"
  return localStorage.getItem(SPORT_THEME_KEY) || "default"
}

export function setSportTheme(sport: string) {
  if (typeof window === "undefined") return
  localStorage.setItem(SPORT_THEME_KEY, sport)
}

// Betting functions
let balanceCache: { value: number; timestamp: number } | null = null
const CACHE_DURATION = 5000 // 5 seconds

export function getBettingBalance(): number {
  if (typeof window === "undefined") return 1000

  // Use cache if valid
  if (balanceCache && Date.now() - balanceCache.timestamp < CACHE_DURATION) {
    return balanceCache.value
  }

  try {
    const balance = localStorage.getItem(BETTING_BALANCE_KEY)
    const value = balance ? Number.parseFloat(balance) : 1000
    balanceCache = { value, timestamp: Date.now() }
    return value
  } catch {
    return 1000
  }
}

export function setBettingBalance(balance: number) {
  if (typeof window === "undefined") return
  localStorage.setItem(BETTING_BALANCE_KEY, balance.toString())
  balanceCache = { value: balance, timestamp: Date.now() }
}

let betsCache: { value: any[]; timestamp: number } | null = null

export function getBets(): any[] {
  if (typeof window === "undefined") return []

  if (betsCache && Date.now() - betsCache.timestamp < CACHE_DURATION) {
    return betsCache.value
  }

  try {
    const bets = JSON.parse(localStorage.getItem(BETS_KEY) || "[]")
    betsCache = { value: bets, timestamp: Date.now() }
    return bets
  } catch {
    return []
  }
}

export function getBettingHistory(): any[] {
  return getBets()
}

export function addBet(bet: any) {
  const bets = getBets()
  bets.unshift(bet)
  localStorage.setItem(BETS_KEY, JSON.stringify(bets))
  betsCache = { value: bets, timestamp: Date.now() }

  // Deduct balance
  const balance = getBettingBalance()
  setBettingBalance(balance - bet.amount)
}

export function updateBetResult(betId: string, result: "home" | "away" | "draw") {
  const bets = getBets()
  const bet = bets.find((b) => b.id === betId)
  if (!bet) return

  bet.result = result
  if (bet.betType === result) {
    bet.status = "won"
    bet.winAmount = bet.amount * bet.odds
    const balance = getBettingBalance()
    setBettingBalance(balance + bet.winAmount)
  } else {
    bet.status = "lost"
  }

  localStorage.setItem(BETS_KEY, JSON.stringify(bets))
  betsCache = { value: bets, timestamp: Date.now() }
}

export function getBettingStats(): any {
  const bets = getBets()
  const wonBets = bets.filter((b) => b.status === "won")
  const lostBets = bets.filter((b) => b.status === "lost")

  return {
    totalBets: bets.length,
    wonBets: wonBets.length,
    lostBets: lostBets.length,
    totalWon: wonBets.reduce((sum, b) => sum + (b.winAmount || 0), 0),
    totalLost: lostBets.reduce((sum, b) => sum + b.amount, 0),
    balance: getBettingBalance(),
  }
}

export function getUserPoints(): number {
  return getBettingBalance()
}

export function placeBet(bet: {
  matchId: string
  matchTitle: string
  team: "home" | "away" | "draw"
  amount: number
  odds: number
  date: number
  sportsDbEventId?: string
  sport?: string
}): { success: boolean; newBalance: number } {
  const currentBalance = getBettingBalance()

  if (bet.amount > currentBalance || bet.amount <= 0) {
    return { success: false, newBalance: currentBalance }
  }

  const newBet = {
    id: Date.now().toString(),
    matchId: bet.matchId,
    matchTitle: bet.matchTitle,
    betType: bet.team,
    amount: bet.amount,
    odds: bet.odds,
    status: "pending",
    date: bet.date,
    sportsDbEventId: bet.sportsDbEventId,
    sport: bet.sport,
  }

  addBet(newBet)
  const newBalance = getBettingBalance()

  addNotification({
    type: "success",
    title: "Pari placé !",
    message: `${bet.amount} points sur ${bet.matchTitle}`,
  })

  return { success: true, newBalance }
}

// Notifications
export function getNotifications(): any[] {
  if (typeof window === "undefined") return []
  try {
    return JSON.parse(localStorage.getItem(NOTIFICATIONS_KEY) || "[]")
  } catch {
    return []
  }
}

export function addNotification(notification: any) {
  const notifications = getNotifications()
  notifications.unshift({ ...notification, id: Date.now().toString(), timestamp: Date.now(), read: false })
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications.slice(0, 50)))
}

export function markNotificationAsRead(id: string) {
  const notifications = getNotifications()
  const notif = notifications.find((n) => n.id === id)
  if (notif) {
    notif.read = true
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications))
  }
}

export function markAllNotificationsAsRead() {
  const notifications = getNotifications()
  notifications.forEach((n) => (n.read = true))
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications))
}

export function getUnreadNotificationsCount(): number {
  return getNotifications().filter((n) => !n.read).length
}

// User management
export function getUserId(): string {
  if (typeof window === "undefined") return ""
  let userId = localStorage.getItem(USER_ID_KEY)
  if (!userId) {
    userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    localStorage.setItem(USER_ID_KEY, userId)
  }
  return userId
}

export function getUsername(): string {
  if (typeof window === "undefined") return ""
  return localStorage.getItem(USERNAME_KEY) || ""
}

export function setUsername(username: string) {
  if (typeof window === "undefined") return
  localStorage.setItem(USERNAME_KEY, username.trim())
}

export function getUserStats(): {
  userId: string
  username: string
  totalPoints: number
  totalBets: number
  wonBets: number
  lostBets: number
  winRate: number
} {
  const bets = getBets()
  const wonBets = bets.filter((b) => b.status === "won")
  const lostBets = bets.filter((b) => b.status === "lost")
  const totalBets = wonBets.length + lostBets.length

  return {
    userId: getUserId(),
    username: getUsername(),
    totalPoints: getBettingBalance(),
    totalBets,
    wonBets: wonBets.length,
    lostBets: lostBets.length,
    winRate: totalBets > 0 ? Math.round((wonBets.length / totalBets) * 100) : 0,
  }
}

// Daily Bonus functions
export function canClaimDailyBonus(): boolean {
  if (typeof window === "undefined") return false

  const lastClaim = localStorage.getItem(DAILY_BONUS_KEY)
  if (!lastClaim) return true

  const lastClaimDate = new Date(Number.parseInt(lastClaim))
  const now = new Date()

  // Check if it's a different day (UTC)
  const lastClaimDay = new Date(lastClaimDate.getUTCFullYear(), lastClaimDate.getUTCMonth(), lastClaimDate.getUTCDate())
  const todayDay = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())

  return todayDay.getTime() > lastClaimDay.getTime()
}

export function claimDailyBonus(): { success: boolean; amount: number; nextClaimTime: number } {
  if (typeof window === "undefined") {
    return { success: false, amount: 0, nextClaimTime: 0 }
  }

  if (!canClaimDailyBonus()) {
    const lastClaim = localStorage.getItem(DAILY_BONUS_KEY)
    const nextClaim = lastClaim ? Number.parseInt(lastClaim) + 24 * 60 * 60 * 1000 : Date.now()
    return { success: false, amount: 0, nextClaimTime: nextClaim }
  }

  // Award the bonus
  const currentBalance = getBettingBalance()
  setBettingBalance(currentBalance + DAILY_BONUS_AMOUNT)

  // Record the claim
  localStorage.setItem(DAILY_BONUS_KEY, Date.now().toString())

  return { success: true, amount: DAILY_BONUS_AMOUNT, nextClaimTime: Date.now() + 24 * 60 * 60 * 1000 }
}

export function getNextDailyBonusTime(): number | null {
  if (typeof window === "undefined") return null

  const lastClaim = localStorage.getItem(DAILY_BONUS_KEY)
  if (!lastClaim) return null

  return Number.parseInt(lastClaim) + 24 * 60 * 60 * 1000
}
