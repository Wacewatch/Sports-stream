import type { Match, Sport, Stream } from "@/types/match"

const API_URL = "https://streami.su/api"
export const IMG_URL = "https://streami.su/api/images"

// Cache simple côté client
const cache = new Map<string, { data: unknown; timestamp: number }>()
const CACHE_TTL = 60 * 1000 // 60 secondes

async function fetchWithCache<T>(endpoint: string, ttl = CACHE_TTL): Promise<T> {
  const cacheKey = endpoint
  const cached = cache.get(cacheKey)

  if (cached && Date.now() - cached.timestamp < ttl) {
    return cached.data as T
  }

  const res = await fetch(`${API_URL}${endpoint}`, {
    next: { revalidate: 60 },
  })

  if (!res.ok) {
    throw new Error(`API Error: ${res.status}`)
  }

  const data = await res.json()
  cache.set(cacheKey, { data, timestamp: Date.now() })
  return data as T
}

export async function getMatches(
  options: {
    sport?: string
    status?: "live" | "all"
    popular?: boolean
    today?: boolean
  } = {},
): Promise<Match[]> {
  let endpoint = "/matches/all-today"

  if (options.status === "live") {
    endpoint = "/matches/live"
  } else if (options.status === "all") {
    endpoint = "/matches/all"
  } else if (options.today && options.popular) {
    endpoint = "/matches/all-today/popular"
  } else if (options.today) {
    endpoint = "/matches/all-today"
  } else if (options.popular) {
    endpoint = "/matches/all/popular"
  } else if (options.sport && options.popular) {
    endpoint = `/matches/${options.sport}/popular`
  } else if (options.sport) {
    endpoint = `/matches/${options.sport}`
  }

  const matches = await fetchWithCache<Match[]>(endpoint)
  const normalized = normalizeMatches(matches)

  console.log("[v0] Fetched matches:", matches.length)
  console.log("[v0] Sport names found:", [...new Set(normalized.map((m) => m.sport_name))])

  return normalized
}

export async function getSports(): Promise<Sport[]> {
  return fetchWithCache<Sport[]>("/sports")
}

export async function getStreams(source: string, id: string): Promise<Stream[]> {
  const res = await fetch(`${API_URL}/stream/${source}/${id}`)
  if (!res.ok) return []
  const data = await res.json()
  return Array.isArray(data) ? data : []
}

function normalizeMatches(matches: Match[]): Match[] {
  return matches.map((m) => ({
    ...m,
    sport_name: normalizeSportName(m.sport_name || m.category || "Other"),
  }))
}

function normalizeSportName(name: string): string {
  if (!name) return "Other"

  const lower = name.toLowerCase()

  // Fight sports
  if (/(ufc|boxing|mma|fight)/i.test(name)) return "Fight"

  // Motor sports
  if (/(f1|formula|racing|motor)/i.test(name)) return "Motor Sports"

  // American Football
  if (/(american.football|nfl)/i.test(lower)) return "American Football"

  // Basketball
  if (/basketball/i.test(name)) return "Basketball"

  // Football/Soccer
  if (/^football$/i.test(name) || /soccer/i.test(name)) return "Football"

  // Hockey
  if (/hockey/i.test(name)) return "Hockey"

  // Baseball
  if (/baseball/i.test(name)) return "Baseball"

  // Tennis
  if (/tennis/i.test(name)) return "Tennis"

  // Rugby
  if (/rugby/i.test(name)) return "Rugby"

  // Golf
  if (/golf/i.test(name)) return "Golf"

  // Cricket
  if (/cricket/i.test(name)) return "Cricket"

  // Billiards
  if (/billiards|snooker|pool/i.test(name)) return "Billiards"

  // AFL
  if (/afl/i.test(name)) return "AFL"

  // Darts
  if (/darts/i.test(name)) return "Darts"

  // Capitalize first letter for other sports
  return name.charAt(0).toUpperCase() + name.slice(1)
}

export const SPORT_ICONS: Record<string, string> = {
  Football: "⚽",
  Basketball: "🏀",
  "American Football": "🏈",
  Hockey: "🏒",
  Baseball: "⚾",
  "Motor Sports": "🏎️",
  Fight: "🥊",
  UFC: "🥊",
  Boxing: "🥊",
  Tennis: "🎾",
  Rugby: "🏉",
  Golf: "⛳",
  Billiards: "🎱",
  AFL: "🏉",
  Darts: "🎯",
  Cricket: "🏏",
  Other: "🏅",
}

export const SPORT_COLORS: Record<string, { primary: string; secondary: string }> = {
  Football: { primary: "#22c55e", secondary: "#16a34a" },
  Basketball: { primary: "#f97316", secondary: "#ea580c" },
  "American Football": { primary: "#8b5cf6", secondary: "#7c3aed" },
  Hockey: { primary: "#06b6d4", secondary: "#0891b2" },
  Baseball: { primary: "#ef4444", secondary: "#dc2626" },
  "Motor Sports": { primary: "#eab308", secondary: "#ca8a04" },
  Fight: { primary: "#dc2626", secondary: "#b91c1c" },
  Tennis: { primary: "#84cc16", secondary: "#65a30d" },
  Rugby: { primary: "#14b8a6", secondary: "#0d9488" },
  default: { primary: "#e50914", secondary: "#b8070e" },
}

const SPORTSDB_API_URL = "https://www.thesportsdb.com/api/v1/json/3"

export async function enrichMatchWithSportsDB(match: Match): Promise<Match> {
  try {
    // Try to get team info if we have team names
    if (match.teams?.home?.name && match.teams?.away?.name) {
      const homeTeam = await searchTeamBySportsDB(match.teams.home.name)
      const awayTeam = await searchTeamBySportsDB(match.teams.away.name)

      if (homeTeam) {
        match.teams.home = {
          ...match.teams.home,
          badge: homeTeam.strTeamBadge || match.teams.home.badge,
          description: homeTeam.strDescriptionEN,
          stadium: homeTeam.strStadium,
          website: homeTeam.strWebsite,
        }
      }

      if (awayTeam) {
        match.teams.away = {
          ...match.teams.away,
          badge: awayTeam.strTeamBadge || match.teams.away.badge,
          description: awayTeam.strDescriptionEN,
          stadium: awayTeam.strStadium,
          website: awayTeam.strWebsite,
        }
      }
    }
  } catch (error) {
    console.error("[v0] Error enriching match with SportsDB:", error)
  }

  return match
}

async function searchTeamBySportsDB(teamName: string): Promise<any> {
  try {
    const res = await fetch(`${SPORTSDB_API_URL}/searchteams.php?t=${encodeURIComponent(teamName)}`)
    const data = await res.json()
    return data.teams?.[0] || null
  } catch {
    return null
  }
}

export async function getLeagueInfo(leagueId: string): Promise<any> {
  try {
    const res = await fetch(`${SPORTSDB_API_URL}/lookupleague.php?id=${leagueId}`)
    const data = await res.json()
    return data.leagues?.[0] || null
  } catch {
    return null
  }
}

export async function getEventDetails(eventId: string): Promise<any> {
  try {
    const res = await fetch(`${SPORTSDB_API_URL}/lookupevent.php?id=${eventId}`)
    const data = await res.json()
    return data.events?.[0] || null
  } catch {
    return null
  }
}
