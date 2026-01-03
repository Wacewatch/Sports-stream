import type { Match } from "@/types/match"
import { searchTeam, findMatchScore } from "./sportsdb"
import { enrichMatchWithMockScore } from "./mock-scores"

export async function enrichMatchWithScores(match: Match): Promise<Match> {
  if (!match.teams?.home?.name || !match.teams?.away?.name) {
    return enrichMatchWithMockScore(match)
  }

  try {
    const matchDate = new Date(match.date)
    const scoreData = await findMatchScore(match.teams.home.name, match.teams.away.name, matchDate)

    if (scoreData && (scoreData.homeScore !== null || scoreData.awayScore !== null)) {
      match.score = {
        home: scoreData.homeScore,
        away: scoreData.awayScore,
        status: scoreData.status,
      }
      match.sportsDbEventId = scoreData.eventId
      return match
    }
  } catch (error) {
    console.error("[Enrichment] Error enriching match:", match.title, error)
  }

  return enrichMatchWithMockScore(match)
}

export async function enrichMatchWithTeamInfo(match: Match): Promise<Match> {
  if (!match.teams?.home?.name || !match.teams?.away?.name) {
    return match
  }

  try {
    const homeTeams = await searchTeam(match.teams.home.name)
    if (homeTeams.length > 0) {
      const homeTeam = homeTeams[0]
      match.teams.home = {
        ...match.teams.home,
        description: homeTeam.strDescriptionEN,
        stadium: homeTeam.strStadium,
        website: homeTeam.strWebsite,
        sportsDbId: homeTeam.idTeam,
      }
    }

    const awayTeams = await searchTeam(match.teams.away.name)
    if (awayTeams.length > 0) {
      const awayTeam = awayTeams[0]
      match.teams.away = {
        ...match.teams.away,
        description: awayTeam.strDescriptionEN,
        stadium: awayTeam.strStadium,
        website: awayTeam.strWebsite,
        sportsDbId: awayTeam.idTeam,
      }
    }
  } catch (error) {
    console.error("[Enrichment] Error enriching match with team info:", error)
  }

  return match
}

// Batch enrich matches with scores
export async function batchEnrichMatches(matches: Match[]): Promise<Match[]> {
  const BATCH_SIZE = 3 // Reduced from 5
  const DELAY_BETWEEN_BATCHES = 2000 // 2 seconds delay between batches
  const enrichedMatches: Match[] = []

  for (let i = 0; i < matches.length; i += BATCH_SIZE) {
    const batch = matches.slice(i, i + BATCH_SIZE)

    for (const match of batch) {
      try {
        const enriched = await enrichMatchWithScores(match)
        enrichedMatches.push(enriched)
      } catch {
        enrichedMatches.push(enrichMatchWithMockScore(match))
      }
    }

    // Add delay between batches to avoid rate limiting
    if (i + BATCH_SIZE < matches.length) {
      await new Promise((resolve) => setTimeout(resolve, DELAY_BETWEEN_BATCHES))
    }
  }

  return enrichedMatches
}
