import { getBets, updateBetResult, addNotification } from "./storage"
import { lookupEvent } from "./sportsdb"
import type { Bet } from "@/types/match"

export interface BetValidationResult {
  betId: string
  matchTitle: string
  status: "won" | "lost" | "pending"
  winAmount?: number
}

// Check if a bet should be validated based on match completion
export async function validateBet(bet: Bet): Promise<BetValidationResult | null> {
  if (bet.status !== "pending") {
    return null
  }

  try {
    // If we have a sportsDbEventId, look it up
    const eventId = (bet as any).sportsDbEventId

    if (!eventId) {
      console.log("[BetValidation] No event ID for bet:", bet.id)
      return null
    }

    // Lookup the event to get the final score
    const event = await lookupEvent(eventId)

    if (!event) {
      console.log("[BetValidation] Event not found:", eventId)
      return null
    }

    // Check if the match is finished
    const isFinished =
      event.strStatus === "Match Finished" ||
      event.strStatus === "FT" ||
      (event.intHomeScore !== null && event.intAwayScore !== null && event.strStatus !== "Not Started")

    if (!isFinished) {
      return null
    }

    // Determine the result
    const homeScore = event.intHomeScore ? Number.parseInt(event.intHomeScore) : null
    const awayScore = event.intAwayScore ? Number.parseInt(event.intAwayScore) : null

    if (homeScore === null || awayScore === null) {
      return null
    }

    let matchResult: "home" | "away" | "draw"
    if (homeScore > awayScore) {
      matchResult = "home"
    } else if (awayScore > homeScore) {
      matchResult = "away"
    } else {
      matchResult = "draw"
    }

    // Check if the bet won
    const betWon = bet.betType === matchResult
    const winAmount = betWon ? Math.floor(bet.amount * bet.odds) : 0

    // Update the bet in storage
    updateBetResult(bet.id, matchResult)

    // Add notification
    if (betWon) {
      addNotification({
        type: "bet_won",
        title: "Pari gagné ! 🎉",
        message: `Vous avez gagné ${winAmount} points sur ${bet.matchTitle}`,
        matchId: bet.matchId,
      })
    } else {
      addNotification({
        type: "bet_lost",
        title: "Pari perdu",
        message: `Votre pari sur ${bet.matchTitle} n'a pas été gagnant`,
        matchId: bet.matchId,
      })
    }

    return {
      betId: bet.id,
      matchTitle: bet.matchTitle,
      status: betWon ? "won" : "lost",
      winAmount: betWon ? winAmount : undefined,
    }
  } catch (error) {
    console.error("[BetValidation] Error validating bet:", error)
    return null
  }
}

// Validate all pending bets
export async function validateAllPendingBets(): Promise<BetValidationResult[]> {
  const bets = getBets()
  const pendingBets = bets.filter((b) => b.status === "pending")

  console.log(`[BetValidation] Checking ${pendingBets.length} pending bets`)

  const results: BetValidationResult[] = []

  for (const bet of pendingBets) {
    const result = await validateBet(bet)
    if (result) {
      results.push(result)
    }
    // Add delay to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 200))
  }

  console.log(`[BetValidation] Validated ${results.length} bets`)

  return results
}

// Auto-validate bets periodically (call this from a useEffect)
export function startBetValidation(intervalMs = 60000): () => void {
  console.log("[BetValidation] Starting auto-validation")

  const interval = setInterval(async () => {
    await validateAllPendingBets()
  }, intervalMs)

  return () => clearInterval(interval)
}
