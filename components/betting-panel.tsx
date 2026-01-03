"use client"

import { useState, useEffect } from "react"
import type { Match } from "@/types/match"
import { placeBet, getUserPoints } from "@/lib/storage"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { TrendingUp, Coins, Check, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

interface BettingPanelProps {
  match: Match
  onBetPlaced?: () => void
}

export function BettingPanel({ match, onBetPlaced }: BettingPanelProps) {
  const [selectedTeam, setSelectedTeam] = useState<"home" | "away" | "draw" | null>(null)
  const [betAmount, setBetAmount] = useState(50)
  const [userPoints, setUserPoints] = useState(0)
  const [isPlacing, setIsPlacing] = useState(false)
  const [success, setSuccess] = useState(false)

  const isBettingAllowed = () => {
    const now = Date.now()
    const matchStart = match.date
    const oneHourAfterStart = matchStart + 60 * 60 * 1000 // 1 hour in milliseconds
    return now < oneHourAfterStart
  }

  const bettingAllowed = isBettingAllowed()

  useEffect(() => {
    setUserPoints(getUserPoints())
  }, [])

  const odds = {
    home: 2.1,
    away: 2.3,
    draw: 3.2,
  }

  const handlePlaceBet = () => {
    if (!selectedTeam || betAmount <= 0 || betAmount > userPoints || !bettingAllowed) return

    setIsPlacing(true)
    setTimeout(() => {
      const result = placeBet({
        matchId: match.id,
        matchTitle: match.title,
        team: selectedTeam,
        amount: betAmount,
        odds: odds[selectedTeam],
        date: Date.now(),
        sportsDbEventId: match.sportsDbEventId,
        sport: match.sport_name,
      })

      if (result.success) {
        setSuccess(true)
        setUserPoints(result.newBalance)
        onBetPlaced?.()

        setTimeout(() => {
          setSuccess(false)
          setSelectedTeam(null)
        }, 2000)
      }
      setIsPlacing(false)
    }, 500)
  }

  const potentialWin = selectedTeam ? Math.floor(betAmount * odds[selectedTeam]) : 0

  return (
    <div className="space-y-4">
      <Card className="p-4 md:p-6 bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/20">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-amber-500" />
            Parier sur ce match
          </h3>
          <div className="flex items-center gap-2 text-amber-500 font-bold">
            <Coins className="w-5 h-5" />
            {userPoints.toLocaleString()} pts
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-amber-500 font-semibold mb-4 p-2 bg-amber-500/10 rounded-lg">
          <AlertTriangle className="w-3 h-3" />
          <span>Paris fictifs - Argent virtuel uniquement</span>
        </div>

        {!bettingAllowed && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-sm text-red-500 font-semibold text-center">
              Les paris sont fermés pour ce match (plus d'1h après le début)
            </p>
          </div>
        )}

        {success ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-green-500 mx-auto flex items-center justify-center mb-4 animate-bounce">
              <Check className="w-8 h-8 text-white" />
            </div>
            <p className="text-lg font-bold text-green-500">Pari placé avec succès !</p>
          </div>
        ) : (
          <>
            {/* Team selection */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <button
                onClick={() => setSelectedTeam("home")}
                disabled={!bettingAllowed}
                className={cn(
                  "p-4 rounded-xl border-2 transition-all hover:scale-105",
                  selectedTeam === "home"
                    ? "border-amber-500 bg-amber-500/20"
                    : "border-border bg-card hover:border-amber-500/50",
                  !bettingAllowed && "opacity-50 cursor-not-allowed hover:scale-100",
                )}
              >
                <div className="text-center">
                  <div className="font-bold text-sm mb-1 line-clamp-1">{match.teams?.home?.name || "Équipe 1"}</div>
                  <div className="text-2xl font-black text-amber-500">{odds.home}x</div>
                </div>
              </button>

              <button
                onClick={() => setSelectedTeam("draw")}
                disabled={!bettingAllowed}
                className={cn(
                  "p-4 rounded-xl border-2 transition-all hover:scale-105",
                  selectedTeam === "draw"
                    ? "border-amber-500 bg-amber-500/20"
                    : "border-border bg-card hover:border-amber-500/50",
                  !bettingAllowed && "opacity-50 cursor-not-allowed hover:scale-100",
                )}
              >
                <div className="text-center">
                  <div className="font-bold text-sm mb-1">Match nul</div>
                  <div className="text-2xl font-black text-amber-500">{odds.draw}x</div>
                </div>
              </button>

              <button
                onClick={() => setSelectedTeam("away")}
                disabled={!bettingAllowed}
                className={cn(
                  "p-4 rounded-xl border-2 transition-all hover:scale-105",
                  selectedTeam === "away"
                    ? "border-amber-500 bg-amber-500/20"
                    : "border-border bg-card hover:border-amber-500/50",
                  !bettingAllowed && "opacity-50 cursor-not-allowed hover:scale-100",
                )}
              >
                <div className="text-center">
                  <div className="font-bold text-sm mb-1 line-clamp-1">{match.teams?.away?.name || "Équipe 2"}</div>
                  <div className="text-2xl font-black text-amber-500">{odds.away}x</div>
                </div>
              </button>
            </div>

            {/* Amount selector */}
            <div className="mb-4">
              <label className="text-sm font-semibold mb-2 block">Montant du pari</label>
              <div className="flex gap-2 mb-3">
                {[50, 100, 250, 500].map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setBetAmount(amount)}
                    disabled={!bettingAllowed}
                    className={cn(
                      "flex-1 py-2 px-3 rounded-lg font-bold text-sm transition-all",
                      betAmount === amount
                        ? "bg-amber-500 text-white"
                        : "bg-card border border-border hover:border-amber-500",
                      !bettingAllowed && "opacity-50 cursor-not-allowed",
                    )}
                  >
                    {amount}
                  </button>
                ))}
              </div>
              <input
                type="range"
                min="10"
                max={Math.min(userPoints, 1000)}
                step="10"
                value={betAmount}
                onChange={(e) => setBetAmount(Number(e.target.value))}
                disabled={!bettingAllowed}
                className="w-full accent-amber-500 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>10 pts</span>
                <span className="font-bold text-foreground">{betAmount} pts</span>
                <span>{Math.min(userPoints, 1000)} pts</span>
              </div>
            </div>

            {/* Potential win */}
            {selectedTeam && (
              <div className="p-3 rounded-lg bg-card border border-border mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Gain potentiel</span>
                  <span className="text-lg font-black text-green-500">+{potentialWin.toLocaleString()} pts</span>
                </div>
              </div>
            )}

            {/* Place bet button */}
            <Button
              onClick={handlePlaceBet}
              disabled={!selectedTeam || betAmount <= 0 || betAmount > userPoints || isPlacing || !bettingAllowed}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold py-6 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {!bettingAllowed ? "Paris fermés" : isPlacing ? "Placement en cours..." : "Placer le pari"}
            </Button>

            {betAmount > userPoints && <p className="text-xs text-red-500 mt-2 text-center">Solde insuffisant !</p>}
          </>
        )}
      </Card>
    </div>
  )
}
