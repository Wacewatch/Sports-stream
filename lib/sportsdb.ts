// TheSportsDB API Integration
// Free API Key: 123

const SPORTSDB_API_BASE = "/api/sportsdb"

export interface SportsDBTeam {
  idTeam: string
  strTeam: string
  strTeamBadge: string
  strStadium: string
  strDescriptionEN: string
  strWebsite: string
  intFormedYear: string
  strCountry: string
  strLeague: string
}

export interface SportsDBEvent {
  idEvent: string
  strEvent: string
  strFilename: string
  strSport: string
  idLeague: string
  strLeague: string
  strSeason: string
  strDescriptionEN: string
  strHomeTeam: string
  strAwayTeam: string
  intHomeScore: string | null
  intAwayScore: string | null
  intSpectators: string
  strHomeGoalDetails: string
  strAwayGoalDetails: string
  strHomeRedCards: string
  strAwayRedCards: string
  strHomeYellowCards: string
  strAwayYellowCards: string
  strHomeLineupGoalkeeper: string
  strAwayLineupGoalkeeper: string
  strHomeLineupDefense: string
  strAwayLineupDefense: string
  strHomeLineupMidfield: string
  strAwayLineupMidfield: string
  strHomeLineupForward: string
  strAwayLineupForward: string
  strHomeLineupSubstitutes: string
  strAwayLineupSubstitutes: string
  dateEvent: string
  strTime: string
  strStatus: string
  strPostponed: string
}

export interface SportsDBEventTimeline {
  idTimeline: string
  strTimeline: string
  strTimelineDetail: string
  strHome: string
  strEvent: string
  idPlayer: string
  strPlayer: string
  intTime: string
  idTeam: string
  strTeam: string
}

export interface SportsDBEventStats {
  strStat: string
  intHome: string
  intAway: string
}

export interface SportsDBTVBroadcast {
  idEvent: string
  strCountry: string
  strChannel: string
  strLogo: string
  strSeason: string
}

export interface SportsDBHighlight {
  idEvent: string
  strVideo: string
  strVideoTitle: string
}

export interface SportsDBEventResults {
  idResult: string
  idEvent: string
  idPlayer: string
  strPlayer: string
  strResult: string
  intPosition: string
  strTeam: string
}

export interface SportsDBLineup {
  idLineup: string
  strEvent: string
  strFormation: string
  strPlayer: string
  strPosition: string
  intSquadNumber: string
  idTeam: string
  strTeam: string
  strPositionShort: string
}

export interface SportsDBLeague {
  idLeague: string
  strLeague: string
  strSport: string
  strLeagueAlternate: string
  strDivision: string
  strCountry: string
  strBadge: string
  strLogo: string
  strDescriptionEN: string
  strFanart1: string
  strBanner: string
}

// Cache management
const cache = new Map<string, { data: any; timestamp: number }>()
const CACHE_DURATION = 300000 // 5 minutes (increased from 1 minute)

let requestQueue: Promise<any> = Promise.resolve()
const REQUEST_DELAY = 300 // 300ms between requests

function queueRequest<T>(fn: () => Promise<T>): Promise<T> {
  const promise = requestQueue.then(() => fn())
  requestQueue = promise.catch(() => {}) // Continue queue even on errors
  return promise
}

async function delayBetweenRequests() {
  await new Promise((resolve) => setTimeout(resolve, REQUEST_DELAY))
}

// Helper to format team names for API search with better error handling
function formatTeamNameForSearch(name: string): string {
  return name.replace(/\s+/g, "_").replace(/[^\w_]/g, "")
}

// Search functions
export async function searchTeam(teamName: string): Promise<SportsDBTeam[]> {
  const cacheKey = `team_${teamName}`
  const cached = getCached<SportsDBTeam[]>(cacheKey)
  if (cached) return cached

  return queueRequest(async () => {
    try {
      const params = new URLSearchParams({
        endpoint: "searchteams.php",
        params: `t=${encodeURIComponent(teamName)}`,
      })
      const response = await fetch(`${SPORTSDB_API_BASE}?${params}`)
      if (!response.ok) throw new Error("Failed to fetch")
      const data = await response.json()
      const result = data.teams || []
      setCache(cacheKey, result)
      await delayBetweenRequests()
      return result
    } catch (error) {
      console.error("[SportsDB] Error searching team:", error)
      return []
    }
  })
}

export async function searchEvent(eventName: string): Promise<SportsDBEvent[]> {
  const cacheKey = `event_${eventName}`
  const cached = getCached<SportsDBEvent[]>(cacheKey)
  if (cached) return cached

  return queueRequest(async () => {
    try {
      const params = new URLSearchParams({
        endpoint: "searchevents.php",
        params: `e=${encodeURIComponent(eventName)}`,
      })
      const response = await fetch(`${SPORTSDB_API_BASE}?${params}`)
      if (!response.ok) throw new Error("Failed to fetch")
      const data = await response.json()
      const result = data.event || []
      setCache(cacheKey, result)
      await delayBetweenRequests()
      return result
    } catch (error) {
      console.error("[SportsDB] Error searching event:", error)
      return []
    }
  })
}

// Lookup functions
export async function lookupTeam(teamId: string): Promise<SportsDBTeam | null> {
  const cacheKey = `lookup_team_${teamId}`
  const cached = getCached<SportsDBTeam>(cacheKey)
  if (cached) return cached

  return queueRequest(async () => {
    try {
      const params = new URLSearchParams({
        endpoint: "lookupteam.php",
        params: `id=${teamId}`,
      })
      const response = await fetch(`${SPORTSDB_API_BASE}?${params}`)
      if (!response.ok) throw new Error("Failed to fetch")
      const data = await response.json()
      const result = data.teams?.[0] || null
      if (result) setCache(cacheKey, result)
      await delayBetweenRequests()
      return result
    } catch (error) {
      console.error("[SportsDB] Error looking up team:", error)
      return null
    }
  })
}

export async function lookupEvent(eventId: string): Promise<SportsDBEvent | null> {
  const cacheKey = `lookup_event_${eventId}`
  const cached = getCached<SportsDBEvent>(cacheKey)
  if (cached) return cached

  return queueRequest(async () => {
    try {
      const params = new URLSearchParams({
        endpoint: "lookupevent.php",
        params: `id=${eventId}`,
      })
      const response = await fetch(`${SPORTSDB_API_BASE}?${params}`)
      if (!response.ok) throw new Error("Failed to fetch")
      const data = await response.json()
      const result = data.events?.[0] || null
      if (result) setCache(cacheKey, result)
      await delayBetweenRequests()
      return result
    } catch (error) {
      console.error("[SportsDB] Error looking up event:", error)
      return null
    }
  })
}

export async function lookupLeague(leagueId: string): Promise<SportsDBLeague | null> {
  const cacheKey = `lookup_league_${leagueId}`
  const cached = getCached<SportsDBLeague>(cacheKey)
  if (cached) return cached

  try {
    const params = new URLSearchParams({
      endpoint: "lookupleague.php",
      params: `id=${leagueId}`,
    })
    const response = await fetch(`${SPORTSDB_API_BASE}?${params}`)
    if (!response.ok) throw new Error("Failed to fetch")
    const data = await response.json()
    const result = data.leagues?.[0] || null
    if (result) setCache(cacheKey, result)
    return result
  } catch (error) {
    console.error("[SportsDB] Error looking up league:", error)
    return null
  }
}

// Schedule functions
export async function getEventsForDay(date: Date, sport?: string): Promise<SportsDBEvent[]> {
  const dateStr = date.toISOString().split("T")[0]
  const cacheKey = `events_day_${dateStr}_${sport || "all"}`
  const cached = getCached<SportsDBEvent[]>(cacheKey)
  if (cached) return cached

  try {
    let queryParams = `d=${dateStr}`
    if (sport) {
      queryParams += `&s=${encodeURIComponent(sport)}`
    }
    const params = new URLSearchParams({
      endpoint: "eventsday.php",
      params: queryParams,
    })
    const response = await fetch(`${SPORTSDB_API_BASE}?${params}`)
    if (!response.ok) throw new Error("Failed to fetch")
    const data = await response.json()
    const result = data.events || []
    setCache(cacheKey, result)
    return result
  } catch (error) {
    console.error("[SportsDB] Error getting events for day:", error)
    return []
  }
}

export async function getEventTimeline(eventId: string): Promise<SportsDBEventTimeline[]> {
  const cacheKey = `timeline_${eventId}`
  const cached = getCached<SportsDBEventTimeline[]>(cacheKey)
  if (cached) return cached

  return queueRequest(async () => {
    try {
      const params = new URLSearchParams({
        endpoint: "lookuptimeline.php",
        params: `id=${eventId}`,
      })
      const response = await fetch(`${SPORTSDB_API_BASE}?${params}`)
      if (!response.ok) throw new Error("Failed to fetch")
      const data = await response.json()
      const result = data.timeline || []
      setCache(cacheKey, result)
      await delayBetweenRequests()
      return result
    } catch (error) {
      console.error("[SportsDB] Error getting event timeline:", error)
      return []
    }
  })
}

export async function getEventLineup(eventId: string): Promise<SportsDBLineup[]> {
  const cacheKey = `lineup_${eventId}`
  const cached = getCached<SportsDBLineup[]>(cacheKey)
  if (cached) return cached

  return queueRequest(async () => {
    try {
      const params = new URLSearchParams({
        endpoint: "lookuplineup.php",
        params: `id=${eventId}`,
      })
      const response = await fetch(`${SPORTSDB_API_BASE}?${params}`)
      if (!response.ok) throw new Error("Failed to fetch")
      const data = await response.json()
      const result = data.lineup || []
      setCache(cacheKey, result)
      await delayBetweenRequests()
      return result
    } catch (error) {
      console.error("[SportsDB] Error getting event lineup:", error)
      return []
    }
  })
}

export async function getEventStats(eventId: string): Promise<SportsDBEventStats[]> {
  const cacheKey = `stats_${eventId}`
  const cached = getCached<SportsDBEventStats[]>(cacheKey)
  if (cached) return cached

  return queueRequest(async () => {
    try {
      const params = new URLSearchParams({
        endpoint: "lookupeventstats.php",
        params: `id=${eventId}`,
      })
      const response = await fetch(`${SPORTSDB_API_BASE}?${params}`)
      if (!response.ok) throw new Error("Failed to fetch")
      const data = await response.json()
      const result = data.eventstats || []
      setCache(cacheKey, result)
      await delayBetweenRequests()
      return result
    } catch (error) {
      console.error("[SportsDB] Error getting event stats:", error)
      return []
    }
  })
}

export async function getTeamNextEvents(teamId: string): Promise<SportsDBEvent[]> {
  const cacheKey = `team_next_${teamId}`
  const cached = getCached<SportsDBEvent[]>(cacheKey)
  if (cached) return cached

  try {
    const params = new URLSearchParams({
      endpoint: "eventsnext.php",
      params: `id=${teamId}`,
    })
    const response = await fetch(`${SPORTSDB_API_BASE}?${params}`)
    if (!response.ok) throw new Error("Failed to fetch")
    const data = await response.json()
    const result = data.events || []
    setCache(cacheKey, result)
    return result
  } catch (error) {
    console.error("[SportsDB] Error getting team next events:", error)
    return []
  }
}

export async function getTeamLastEvents(teamId: string): Promise<SportsDBEvent[]> {
  const cacheKey = `team_last_${teamId}`
  const cached = getCached<SportsDBEvent[]>(cacheKey)
  if (cached) return cached

  try {
    const params = new URLSearchParams({
      endpoint: "eventslast.php",
      params: `id=${teamId}`,
    })
    const response = await fetch(`${SPORTSDB_API_BASE}?${params}`)
    if (!response.ok) throw new Error("Failed to fetch")
    const data = await response.json()
    const result = data.results || []
    setCache(cacheKey, result)
    return result
  } catch (error) {
    console.error("[SportsDB] Error getting team last events:", error)
    return []
  }
}

export async function findMatchScore(
  homeTeam: string,
  awayTeam: string,
  matchDate?: Date,
): Promise<{ homeScore: number | null; awayScore: number | null; status: string; eventId?: string } | null> {
  try {
    // Format team names
    const home = formatTeamNameForSearch(homeTeam)
    const away = formatTeamNameForSearch(awayTeam)

    const query = `${home}_vs_${away}`
    const events = await searchEvent(query)

    if (events.length > 0) {
      // Find the best matching event
      let bestMatch = events[0]

      // If we have a date, try to find the match on that date
      if (matchDate) {
        const dateStr = matchDate.toISOString().split("T")[0]
        const matchOnDate = events.find((e) => e.dateEvent === dateStr)
        if (matchOnDate) {
          bestMatch = matchOnDate
        }
      }

      // Check if this event matches our teams
      const matchesTeams =
        bestMatch.strHomeTeam?.toLowerCase().includes(homeTeam.toLowerCase()) ||
        bestMatch.strAwayTeam?.toLowerCase().includes(awayTeam.toLowerCase())

      if (matchesTeams) {
        return {
          homeScore: bestMatch.intHomeScore ? Number.parseInt(bestMatch.intHomeScore) : null,
          awayScore: bestMatch.intAwayScore ? Number.parseInt(bestMatch.intAwayScore) : null,
          status: bestMatch.strStatus || "Unknown",
          eventId: bestMatch.idEvent,
        }
      }
    }

    return null
  } catch (error) {
    console.error("[SportsDB] Error finding match score:", error)
    return null
  }
}

// New API functions for TV broadcasts, highlights, and results
export async function getEventTVBroadcasts(eventId: string): Promise<SportsDBTVBroadcast[]> {
  const cacheKey = `tv_${eventId}`
  const cached = getCached<SportsDBTVBroadcast[]>(cacheKey)
  if (cached) return cached

  return queueRequest(async () => {
    try {
      // Note: TV endpoint uses API key 3, not 123
      const params = new URLSearchParams({
        endpoint: "lookuptv.php",
        params: `id=${eventId}`,
        apiKey: "3",
      })
      const response = await fetch(`${SPORTSDB_API_BASE}?${params}`)
      if (!response.ok) {
        console.log(`[v0] TV broadcasts not available for event ${eventId}`)
        return []
      }
      const data = await response.json()
      const result = data.tvevent || []
      setCache(cacheKey, result)
      await delayBetweenRequests()
      return result
    } catch (error) {
      console.error("[SportsDB] Error getting TV broadcasts:", error)
      return []
    }
  })
}

export async function getEventHighlights(eventId: string): Promise<SportsDBHighlight[]> {
  const cacheKey = `highlights_${eventId}`
  const cached = getCached<SportsDBHighlight[]>(cacheKey)
  if (cached) return cached

  return queueRequest(async () => {
    try {
      // The lookuphighlight.php endpoint doesn't exist in the free API
      const params = new URLSearchParams({
        endpoint: "searchevents.php",
        params: `e=&id=${eventId}`,
      })
      const response = await fetch(`${SPORTSDB_API_BASE}?${params}`)
      if (!response.ok) {
        console.log(`[v0] Highlights not available for event ${eventId}`)
        return []
      }
      const data = await response.json()

      // Extract video highlights from event data if available
      const event = data.events?.[0]
      const result: SportsDBHighlight[] = []

      if (event?.strVideo) {
        result.push({
          idEvent: eventId,
          strVideo: event.strVideo,
          strVideoTitle: `${event.strEvent} Highlights`,
        })
      }

      setCache(cacheKey, result)
      await delayBetweenRequests()
      return result
    } catch (error) {
      console.error("[SportsDB] Error getting highlights:", error)
      return []
    }
  })
}

export async function getEventResults(eventId: string): Promise<SportsDBEventResults[]> {
  const cacheKey = `results_${eventId}`
  const cached = getCached<SportsDBEventResults[]>(cacheKey)
  if (cached) return cached

  return queueRequest(async () => {
    try {
      const params = new URLSearchParams({
        endpoint: "eventresults.php",
        params: `id=${eventId}`,
      })
      const response = await fetch(`${SPORTSDB_API_BASE}?${params}`)
      if (!response.ok) throw new Error("Failed to fetch")
      const data = await response.json()
      const result = data.results || []
      setCache(cacheKey, result)
      await delayBetweenRequests()
      return result
    } catch (error) {
      console.error("[SportsDB] Error getting event results:", error)
      return []
    }
  })
}

// Helper function to get cached data
function getCached<T>(key: string): T | null {
  const cached = cache.get(key)
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data as T
  }
  return null
}

// Helper function to set cached data
function setCache(key: string, data: any): void {
  cache.set(key, { data, timestamp: Date.now() })
}

export async function getAllSports(): Promise<string[]> {
  const cacheKey = "all_sports"
  const cached = getCached<string[]>(cacheKey)
  if (cached) return cached

  try {
    const params = new URLSearchParams({
      endpoint: "all_sports.php",
      params: "",
    })
    const response = await fetch(`${SPORTSDB_API_BASE}?${params}`)
    if (!response.ok) throw new Error("Failed to fetch")
    const data = await response.json()
    const result = data.sports?.map((s: any) => s.strSport) || []
    setCache(cacheKey, result)
    return result
  } catch (error) {
    console.error("[SportsDB] Error getting all sports:", error)
    // Return default sports if API fails
    return ["Soccer", "Basketball", "American Football", "Hockey", "Baseball", "Cricket", "Tennis", "Rugby"]
  }
}
