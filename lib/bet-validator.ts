import { lookupEvent } from "./sportsdb"
import { getBets, updateBetResult, addNotification } from "./storage"

export interface BetValidationResult {
  betId: string
  matchTitle: string
  status: "won" | "lost" | "no_scores"
  result?: "home" | "away" | "draw"
  homeScore?: number
  awayScore?: number
  winAmount?: number
  error?: string
}

export async function validatePendingBets(): Promise<BetValidationResult[]> {
  console.log("[v0] validatePendingBets started")
  const bets = getBets()
  console.log("[v0] Total bets:", bets.length)
  const pendingBets = bets.filter((bet) => bet.status === "pending" && bet.sportsDbEventId)
  console.log("[v0] Pending bets with sportsDbEventId:", pendingBets.length)

  if (pendingBets.length === 0) {
    console.log("[v0] No pending bets to validate")
    return []
  }

  const results: BetValidationResult[] = []

  for (const bet of pendingBets) {
    try {
      console.log(`[v0] Validating bet ${bet.id} for match ${bet.matchTitle}, eventId: ${bet.sportsDbEventId}`)

      const event = await lookupEvent(bet.sportsDbEventId)
      console.log(`[v0] Event lookup result for ${bet.sportsDbEventId}:`, event ? "found" : "not found")

      if (!event) {
        console.log(`[v0] No event found for bet ${bet.id}`)
        addNotification({
          type: "warning",
          title: "Validation impossible",
          message: `Impossible de valider le pari sur ${bet.matchTitle} - match introuvable`,
        })
        results.push({
          betId: bet.id,
          matchTitle: bet.matchTitle,
          status: "no_scores",
          error: "Match introuvable dans l'API",
        })
        continue
      }

      const isFinished = event.strStatus === "FT" || event.strStatus === "AOT" || event.strStatus === "AET"
      console.log(`[v0] Match ${bet.matchTitle} status: ${event.strStatus}, isFinished: ${isFinished}`)

      const homeScore = event.intHomeScore ? Number.parseInt(event.intHomeScore) : null
      const awayScore = event.intAwayScore ? Number.parseInt(event.intAwayScore) : null
      console.log(`[v0] Scores: ${homeScore} - ${awayScore}`)

      if (!isFinished) {
        console.log(`[v0] Match ${bet.matchTitle} not finished yet (status: ${event.strStatus})`)
        continue
      }

      if (homeScore === null || awayScore === null) {
        console.log(`[v0] Match ${bet.matchTitle} has no scores available`)
        addNotification({
          type: "warning",
          title: "Scores introuvables",
          message: `Impossible de valider le pari sur ${bet.matchTitle} - scores non disponibles`,
        })
        results.push({
          betId: bet.id,
          matchTitle: bet.matchTitle,
          status: "no_scores",
          error: "Scores introuvables",
        })
        continue
      }

      let matchResult: "home" | "away" | "draw"
      if (homeScore > awayScore) {
        matchResult = "home"
      } else if (awayScore > homeScore) {
        matchResult = "away"
      } else {
        matchResult = "draw"
      }

      console.log(`[v0] Match result: ${matchResult} (${homeScore}-${awayScore}), bet type was: ${bet.betType}`)

      updateBetResult(bet.id, matchResult)

      const betStatus = bet.betType === matchResult ? "won" : "lost"
      console.log(`[v0] Bet ${bet.id} result: ${betStatus}`)

      if (betStatus === "won") {
        const winAmount = bet.amount * bet.odds
        addNotification({
          type: "success",
          title: "Pari gagné !",
          message: `${bet.matchTitle}: +${winAmount.toFixed(2)} points`,
        })

        results.push({
          betId: bet.id,
          matchTitle: bet.matchTitle,
          status: "won",
          result: matchResult,
          homeScore,
          awayScore,
          winAmount,
        })
      } else {
        addNotification({
          type: "error",
          title: "Pari perdu",
          message: `${bet.matchTitle}: -${bet.amount} points`,
        })

        results.push({
          betId: bet.id,
          matchTitle: bet.matchTitle,
          status: "lost",
          result: matchResult,
          homeScore,
          awayScore,
        })
      }
    } catch (error) {
      console.error(`[v0] Error validating bet ${bet.id}:`, error)
      addNotification({
        type: "error",
        title: "Erreur de validation",
        message: `Erreur lors de la validation du pari sur ${bet.matchTitle}`,
      })
      results.push({
        betId: bet.id,
        matchTitle: bet.matchTitle,
        status: "no_scores",
        error: error instanceof Error ? error.message : "Erreur inconnue",
      })
    }
  }

  console.log(`[v0] Validated ${results.length} bets total`)
  return results
}

export async function validateSingleBet(betId: string): Promise<BetValidationResult | null> {
  const bets = getBets()
  const bet = bets.find((b) => b.id === betId)

  if (!bet || bet.status !== "pending" || !bet.sportsDbEventId) {
    return null
  }

  try {
    const event = await lookupEvent(bet.sportsDbEventId)

    if (!event) {
      console.log(`[v0] No event found for bet ${betId}`)
      addNotification({
        type: "warning",
        title: "Validation impossible",
        message: `Match introuvable pour ${bet.matchTitle}`,
      })
      return {
        betId: bet.id,
        matchTitle: bet.matchTitle,
        status: "no_scores",
        error: "Match introuvable",
      }
    }

    const isFinished = event.strStatus === "FT" || event.strStatus === "AOT" || event.strStatus === "AET"
    const homeScore = event.intHomeScore ? Number.parseInt(event.intHomeScore) : null
    const awayScore = event.intAwayScore ? Number.parseInt(event.intAwayScore) : null

    if (!isFinished || homeScore === null || awayScore === null) {
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

    updateBetResult(bet.id, matchResult)

    const betStatus = bet.betType === matchResult ? "won" : "lost"
    const winAmount = betStatus === "won" ? bet.amount * bet.odds : undefined

    return {
      betId: bet.id,
      matchTitle: bet.matchTitle,
      status: betStatus,
      result: matchResult,
      homeScore,
      awayScore,
      winAmount,
    }
  } catch (error) {
    console.error(`[v0] Error validating bet ${betId}:`, error)
    addNotification({
      type: "error",
      title: "Erreur de validation",
      message: "Erreur lors de la validation du pari",
    })
    return {
      betId: bet.id,
      matchTitle: bet.matchTitle,
      status: "no_scores",
      error: error instanceof Error ? error.message : "Erreur inconnue",
    }
  }
}
