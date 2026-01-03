"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { getBettingHistory, getUserStats, getUsername } from "@/lib/storage"
import { Trophy, TrendingUp, TrendingDown, Medal, Crown, Award, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { createBrowserClient } from "@supabase/ssr"

interface BetLeaderboardEntry {
  id: string
  matchTitle: string
  sport: string
  betType: string
  amount: number
  odds: number
  winAmount: number
  timestamp: number
}

interface UserStats {
  userId: string
  username: string
  totalPoints: number
  totalBets: number
  wonBets: number
  winRate: number
}

export function BettingLeaderboard() {
  const [bestBets, setBestBets] = useState<BetLeaderboardEntry[]>([])
  const [worstBets, setWorstBets] = useState<BetLeaderboardEntry[]>([])
  const [topUsers, setTopUsers] = useState<UserStats[]>([])
  const [loading, setLoading] = useState(true)
  const [username, setUsername] = useState("")

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  useEffect(() => {
    const uname = getUsername()
    setUsername(uname || "Vous")
    loadLeaderboardData()
  }, [])

  const loadLeaderboardData = async () => {
    setLoading(true)
    try {
      const history = getBettingHistory()

      // Best bets (highest wins)
      const wonBets = history
        .filter((bet) => bet.status === "won" && bet.winAmount)
        .sort((a, b) => (b.winAmount || 0) - (a.winAmount || 0))
        .slice(0, 5)
        .map((bet) => ({
          id: bet.id,
          matchTitle: bet.matchTitle,
          sport: bet.sport,
          betType: bet.betType,
          amount: bet.amount,
          odds: bet.odds,
          winAmount: bet.winAmount || 0,
          timestamp: bet.timestamp,
        }))

      // Worst bets (highest losses)
      const lostBets = history
        .filter((bet) => bet.status === "lost")
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5)
        .map((bet) => ({
          id: bet.id,
          matchTitle: bet.matchTitle,
          sport: bet.sport,
          betType: bet.betType,
          amount: bet.amount,
          odds: bet.odds,
          winAmount: -bet.amount,
          timestamp: bet.timestamp,
        }))

      setBestBets(wonBets)
      setWorstBets(lostBets)

      await loadTopUsers()
    } catch (error) {
      console.error("[v0] Error loading leaderboard:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadTopUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("user_stats")
        .select("*")
        .order("total_points", { ascending: false })
        .limit(10)

      if (error) {
        console.log("[v0] Database not ready, using local data:", error)
        // Fallback to local data
        const currentUserStats = getUserStats()
        setTopUsers([
          {
            userId: currentUserStats.userId,
            username: currentUserStats.username || "Vous",
            totalPoints: currentUserStats.totalPoints,
            totalBets: currentUserStats.totalBets,
            wonBets: currentUserStats.wonBets,
            winRate: currentUserStats.winRate,
          },
        ])
        return
      }

      if (data && data.length > 0) {
        const users = data.map((row) => ({
          userId: row.user_id,
          username: row.username || `User ${row.user_id.slice(-4)}`,
          totalPoints: row.total_points,
          totalBets: row.total_bets,
          wonBets: row.won_bets,
          winRate: Number.parseFloat(row.win_rate) || 0,
        }))
        setTopUsers(users)
      } else {
        // No data yet, show current user
        const currentUserStats = getUserStats()
        setTopUsers([
          {
            userId: currentUserStats.userId,
            username: currentUserStats.username || "Vous",
            totalPoints: currentUserStats.totalPoints,
            totalBets: currentUserStats.totalBets,
            wonBets: currentUserStats.wonBets,
            winRate: currentUserStats.winRate,
          },
        ])
      }
    } catch (err) {
      console.error("[v0] Error querying user stats:", err)
    }
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-5 h-5 text-amber-400" />
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />
      case 3:
        return <Award className="w-5 h-5 text-amber-600" />
      default:
        return <span className="text-muted-foreground font-bold">#{rank}</span>
    }
  }

  const getBetTypeLabel = (type: string) => {
    switch (type) {
      case "home":
        return "Domicile"
      case "away":
        return "Extérieur"
      case "draw":
        return "Match Nul"
      default:
        return type
    }
  }

  return (
    <Card className="w-full bg-gradient-to-br from-card via-card to-accent/5 border-primary/20">
      <CardHeader>
        <CardTitle className="text-2xl font-black flex items-center gap-3">
          <Trophy className="w-7 h-7 text-amber-500" />
          Classements des Paris
        </CardTitle>
        <p className="text-sm text-muted-foreground">Découvrez les meilleurs paris et les meilleurs parieurs</p>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="best" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="best">
              <TrendingUp className="w-4 h-4 mr-2" />
              Meilleurs Paris
            </TabsTrigger>
            <TabsTrigger value="worst">
              <TrendingDown className="w-4 h-4 mr-2" />
              Pires Paris
            </TabsTrigger>
            <TabsTrigger value="users">
              <Crown className="w-4 h-4 mr-2" />
              Top Joueurs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="best" className="space-y-3">
            {bestBets.length > 0 ? (
              bestBets.map((bet, index) => (
                <div
                  key={bet.id}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-green-500/10 to-transparent border border-green-500/20 rounded-lg hover:border-green-500/40 transition-all"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-500/20 text-green-500 font-black">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-green-500 font-semibold mb-1">{username}</p>
                      <h4 className="font-bold text-sm line-clamp-1">{bet.matchTitle}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {bet.sport}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{getBetTypeLabel(bet.betType)}</span>
                        <span className="text-xs text-muted-foreground">×{bet.odds}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-green-500">+{bet.winAmount.toFixed(2)} pts</p>
                    <p className="text-xs text-muted-foreground">Mise: {bet.amount} pts</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p>Aucun pari gagnant pour le moment</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="worst" className="space-y-3">
            {worstBets.length > 0 ? (
              worstBets.map((bet, index) => (
                <div
                  key={bet.id}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-red-500/10 to-transparent border border-red-500/20 rounded-lg hover:border-red-500/40 transition-all"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-500/20 text-red-500 font-black">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-red-500 font-semibold mb-1">{username}</p>
                      <h4 className="font-bold text-sm line-clamp-1">{bet.matchTitle}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {bet.sport}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{getBetTypeLabel(bet.betType)}</span>
                        <span className="text-xs text-muted-foreground">×{bet.odds}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-red-500">{bet.winAmount.toFixed(2)} pts</p>
                    <p className="text-xs text-muted-foreground">Perdu: {bet.amount} pts</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <TrendingDown className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p>Aucun pari perdu pour le moment</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="users" className="space-y-3">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : topUsers.length > 0 ? (
              topUsers.map((user, index) => (
                <div
                  key={user.userId}
                  className={cn(
                    "flex items-center justify-between p-4 rounded-lg border transition-all hover:scale-[1.02]",
                    index === 0
                      ? "bg-gradient-to-r from-amber-500/20 to-transparent border-amber-500/40"
                      : index === 1
                        ? "bg-gradient-to-r from-gray-400/20 to-transparent border-gray-400/40"
                        : index === 2
                          ? "bg-gradient-to-r from-amber-600/20 to-transparent border-amber-600/40"
                          : "bg-muted/50 border-border",
                  )}
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-background border-2 border-border">
                      {getRankIcon(index + 1)}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold">{user.username}</h4>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span>{user.totalBets} paris</span>
                        <span>•</span>
                        <span>{user.wonBets} victoires</span>
                        <span>•</span>
                        <Badge variant="secondary" className="text-xs">
                          {Math.round(user.winRate)}% Win Rate
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black text-primary">{user.totalPoints.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">points</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Crown className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p>Aucun joueur pour le moment</p>
                <p className="text-xs mt-2">Soyez le premier à parier!</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
