"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Search } from "lucide-react"
import type { Match } from "@/types/match"
import { getMatches, SPORT_COLORS, SPORT_ICONS } from "@/lib/api"
import { MatchCard } from "@/components/match-card"
import { MatchModal } from "@/components/match-modal"
import { SkeletonCard } from "@/components/skeleton-card"

export default function SportPage() {
  const params = useParams()
  const router = useRouter()
  const sport = params.sport as string
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    loadMatches()
  }, [sport])

  const loadMatches = async () => {
    setLoading(true)
    try {
      const data = await getMatches()
      const filtered = data.filter((m) => m.sport_name === decodeURIComponent(sport))
      setMatches(filtered)
    } catch (error) {
      console.error("Error loading matches:", error)
    } finally {
      setLoading(false)
    }
  }

  const sportName = decodeURIComponent(sport)
  const colors = SPORT_COLORS[sportName] || SPORT_COLORS.default
  const sportIcon = SPORT_ICONS[sportName] || "🏅"

  const filteredMatches = searchQuery
    ? matches.filter(
        (m) =>
          m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.teams?.home?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.teams?.away?.name?.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : matches

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-border">
        <div className="max-w-[1920px] mx-auto px-4 md:px-8 py-4">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-muted transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 flex-1">
              <span className="text-3xl" style={{ color: colors.primary }}>
                {sportIcon}
              </span>
              <div>
                <h1 className="text-2xl font-black">{sportName}</h1>
                <p className="text-sm text-muted-foreground">{matches.length} matchs disponibles</p>
              </div>
            </div>

            {/* Search */}
            <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-2">
              <Search className="w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent outline-none text-sm w-32 md:w-48"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-[1920px] mx-auto px-4 md:px-8 py-8">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : filteredMatches.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredMatches.map((match, index) => (
              <MatchCard key={match.id} match={match} onClick={() => setSelectedMatch(match)} index={index} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <span className="text-6xl mb-4 block">{sportIcon}</span>
            <h3 className="text-xl font-bold mb-2">{searchQuery ? "Aucun résultat" : "Aucun match disponible"}</h3>
            <p className="text-muted-foreground">
              {searchQuery ? "Essayez une autre recherche" : "Revenez plus tard !"}
            </p>
          </div>
        )}
      </main>

      {/* Modal */}
      <MatchModal match={selectedMatch} onClose={() => setSelectedMatch(null)} />
    </div>
  )
}
