export interface Team {
  name: string
  badge: string | null
  description?: string
  stadium?: string
  website?: string
  sportsDbId?: string
}

export interface Source {
  source: string
  id: string
}

export interface Stream {
  embedUrl: string
  language: string
  hd: boolean
  source: string
}

export interface MatchScore {
  home: number | null
  away: number | null
  status: string
}

export interface MatchStats {
  possession?: { home: number; away: number }
  shots?: { home: number; away: number }
  shotsOnTarget?: { home: number; away: number }
  corners?: { home: number; away: number }
  fouls?: { home: number; away: number }
  yellowCards?: { home: number; away: number }
  redCards?: { home: number; away: number }
}

export interface MatchTimeline {
  id: string
  time: string
  team: "home" | "away"
  type: "goal" | "yellow_card" | "red_card" | "substitution"
  player: string
  detail?: string
}

export interface Match {
  id: string
  title: string
  date: number
  category: string
  sport_name: string
  popular: boolean
  teams: {
    home: Team
    away: Team
  }
  sources: Source[]
  score?: MatchScore
  stats?: MatchStats
  timeline?: MatchTimeline[]
  sportsDbEventId?: string
  leagueId?: string
}

export interface Sport {
  id: string
  name: string
}

export type ThemeMode = "dark" | "light"
export type SportTheme = "default" | "football" | "basketball" | "hockey" | "tennis" | "fight"

export interface Bet {
  id: string
  matchId: string
  matchTitle: string
  sport: string
  betType: "home" | "away" | "draw"
  amount: number
  odds: number
  timestamp: number
  status: "pending" | "won" | "lost"
  result?: "home" | "away" | "draw"
  winAmount?: number
}

export interface BettingStats {
  totalBets: number
  wonBets: number
  lostBets: number
  totalWon: number
  totalLost: number
  balance: number
}

export interface Notification {
  id: string
  type: "bet_placed" | "bet_won" | "bet_lost" | "match_live" | "favorite_starting"
  title: string
  message: string
  timestamp: number
  read: boolean
  matchId?: string
}
