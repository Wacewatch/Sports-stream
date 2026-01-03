// Generate realistic mock scores for matches when API is unavailable
import type { Match } from "@/types/match"

export function generateMockScore(match: Match): { homeScore: number; awayScore: number; status: string } {
  const matchDate = new Date(match.date)
  const now = new Date()
  const isFinished = matchDate < now
  const isLive = Math.abs(matchDate.getTime() - now.getTime()) < 2 * 60 * 60 * 1000 // within 2 hours

  if (isLive) {
    return {
      homeScore: Math.floor(Math.random() * 4),
      awayScore: Math.floor(Math.random() * 4),
      status: "LIVE",
    }
  }

  if (isFinished) {
    return {
      homeScore: Math.floor(Math.random() * 5),
      awayScore: Math.floor(Math.random() * 5),
      status: "FT",
    }
  }

  return {
    homeScore: 0,
    awayScore: 0,
    status: "NS",
  }
}

export function enrichMatchWithMockScore(match: Match): Match {
  if (!match.score) {
    const mockScore = generateMockScore(match)
    match.score = {
      homeScore: mockScore.homeScore,
      awayScore: mockScore.awayScore,
      status: mockScore.status,
    }
  }
  return match
}
