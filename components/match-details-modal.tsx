"use client"

import { useEffect, useState } from "react"
import type { Match } from "@/types/match"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import { LazyImage } from "./lazy-image"
import { IMG_URL } from "@/lib/api"
import {
  getEventStats,
  getEventTimeline,
  getEventLineup,
  getEventTVBroadcasts,
  getEventHighlights,
  getEventResults,
  searchEvent,
  lookupEvent,
} from "@/lib/sportsdb"
import type { SportsDBLineup, SportsDBTVBroadcast, SportsDBHighlight, SportsDBEventResults } from "@/lib/sportsdb"
import {
  Trophy,
  Target,
  Activity,
  Calendar,
  MapPin,
  Users,
  Clock,
  TrendingUp,
  UserCircle,
  History,
  Tv,
  Youtube,
  Award,
} from "lucide-react"

interface MatchDetailsModalProps {
  match: Match | null
  open: boolean
  onClose: () => void
}

export function MatchDetailsModal({ match, open, onClose }: MatchDetailsModalProps) {
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState<any[]>([])
  const [timeline, setTimeline] = useState<any[]>([])
  const [lineup, setLineup] = useState<SportsDBLineup[]>([])
  const [tvBroadcasts, setTvBroadcasts] = useState<SportsDBTVBroadcast[]>([])
  const [highlights, setHighlights] = useState<SportsDBHighlight[]>([])
  const [results, setResults] = useState<SportsDBEventResults[]>([])
  const [eventDetails, setEventDetails] = useState<any>(null)

  useEffect(() => {
    if (!match || !open) return

    async function loadMatchDetails() {
      setLoading(true)
      console.log("[v0] Loading match details for:", match.title)

      try {
        const searchQuery = `${match.teams.home.name}_vs_${match.teams.away.name}`
        const events = await searchEvent(searchQuery)

        console.log("[v0] Search events result:", events.length)

        if (events.length > 0) {
          const event = events[0]
          const eventId = event.idEvent

          console.log("[v0] Found event ID:", eventId)

          const [eventData, statsData, timelineData, lineupData, tvData, highlightsData, resultsData] =
            await Promise.all([
              lookupEvent(eventId),
              getEventStats(eventId),
              getEventTimeline(eventId),
              getEventLineup(eventId),
              getEventTVBroadcasts(eventId),
              getEventHighlights(eventId),
              getEventResults(eventId),
            ])

          console.log("[v0] Match data loaded:", {
            stats: statsData.length,
            timeline: timelineData.length,
            lineup: lineupData.length,
            tvBroadcasts: tvData.length,
            highlights: highlightsData.length,
            results: resultsData.length,
          })

          setEventDetails(eventData)
          setStats(statsData)
          setTimeline(timelineData)
          setLineup(lineupData)
          setTvBroadcasts(tvData)
          setHighlights(highlightsData)
          setResults(resultsData)
        } else {
          console.log("[v0] No events found for search query:", searchQuery)
        }
      } catch (error) {
        console.error("[v0] Error loading match details:", error)
      } finally {
        setLoading(false)
      }
    }

    loadMatchDetails()
  }, [match, open])

  if (!match) return null

  const homeBadge = match.teams?.home?.badge
  const awayBadge = match.teams?.away?.badge
  const hbUrl = homeBadge ? `${IMG_URL}/badge/${homeBadge}.webp` : "https://i.imgur.com/zdFYbFp.png?v=1"
  const abUrl = awayBadge ? `${IMG_URL}/badge/${awayBadge}.webp` : "https://i.imgur.com/zdFYbFp.png?v=1"

  const hasScore = match.score && (match.score.home !== null || match.score.away !== null)
  const isLive = match.date / 1000 <= Date.now() / 1000 && match.date / 1000 >= Date.now() / 1000 - 7200

  const homeLineup = lineup.filter((player) => {
    const playerTeam = player.strTeam?.toLowerCase() || ""
    const homeName = match.teams.home.name?.toLowerCase() || ""
    return playerTeam.includes(homeName) || homeName.includes(playerTeam)
  })

  const awayLineup = lineup.filter((player) => {
    const playerTeam = player.strTeam?.toLowerCase() || ""
    const awayName = match.teams.away.name?.toLowerCase() || ""
    return playerTeam.includes(awayName) || awayName.includes(playerTeam)
  })

  const homeFormation = homeLineup[0]?.strFormation || eventDetails?.strHomeFormation || "4-3-3"
  const awayFormation = awayLineup[0]?.strFormation || eventDetails?.strAwayFormation || "4-2-3-1"

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black flex items-center gap-3">
            <Trophy className="w-6 h-6 text-amber-500" />
            Détails du Match
          </DialogTitle>
        </DialogHeader>

        <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Badge variant="outline" className="text-sm">
                {match.sport_name}
              </Badge>
              {isLive && <Badge className="bg-red-500 animate-pulse">🔴 EN DIRECT</Badge>}
            </div>

            <div className="flex items-center justify-around gap-8">
              <div className="flex flex-col items-center gap-3 flex-1">
                <LazyImage src={hbUrl} alt={match.teams.home.name} className="w-20 h-20 drop-shadow-lg" />
                <h3 className="text-lg font-bold text-center">{match.teams.home.name}</h3>
                {match.teams.home.stadium && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="w-3 h-3" />
                    {match.teams.home.stadium}
                  </div>
                )}
              </div>

              <div className="flex flex-col items-center gap-2">
                {hasScore ? (
                  <>
                    <div className="flex items-center gap-4 text-4xl font-black">
                      <span className="text-primary">{match.score!.home ?? "-"}</span>
                      <span className="text-muted-foreground">-</span>
                      <span className="text-primary">{match.score!.away ?? "-"}</span>
                    </div>
                    {match.score!.status && (
                      <Badge variant="secondary" className="text-xs">
                        {match.score!.status}
                      </Badge>
                    )}
                  </>
                ) : (
                  <div className="text-2xl font-black text-muted-foreground">VS</div>
                )}
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  {new Date(match.date).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>

              <div className="flex flex-col items-center gap-3 flex-1">
                <LazyImage src={abUrl} alt={match.teams.away.name} className="w-20 h-20 drop-shadow-lg" />
                <h3 className="text-lg font-bold text-center">{match.teams.away.name}</h3>
                {match.teams.away.stadium && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="w-3 h-3" />
                    {match.teams.away.stadium}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="stats" className="mt-6">
          <TabsList className="grid w-full grid-cols-7 text-xs">
            <TabsTrigger value="stats">
              <Activity className="w-4 h-4 mr-1" />
              Stats
            </TabsTrigger>
            <TabsTrigger value="composition">
              <UserCircle className="w-4 h-4 mr-1" />
              Compo
            </TabsTrigger>
            <TabsTrigger value="events">
              <History className="w-4 h-4 mr-1" />
              Événements
            </TabsTrigger>
            <TabsTrigger value="timeline">
              <Clock className="w-4 h-4 mr-1" />
              Timeline
            </TabsTrigger>
            <TabsTrigger value="tv">
              <Tv className="w-4 h-4 mr-1" />
              TV
            </TabsTrigger>
            <TabsTrigger value="highlights">
              <Youtube className="w-4 h-4 mr-1" />
              Vidéos
            </TabsTrigger>
            <TabsTrigger value="info">
              <Target className="w-4 h-4 mr-1" />
              Infos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="stats" className="mt-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Spinner className="w-8 h-8" />
              </div>
            ) : stats.length > 0 ? (
              <div className="space-y-4">
                {stats.map((stat, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between text-sm font-medium">
                      <span>{stat.intHome || 0}</span>
                      <span className="text-muted-foreground">{stat.strStat}</span>
                      <span>{stat.intAway || 0}</span>
                    </div>
                    <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="absolute left-0 top-0 h-full bg-primary rounded-full transition-all"
                        style={{
                          width: `${(Number.parseInt(stat.intHome || "0") / (Number.parseInt(stat.intHome || "0") + Number.parseInt(stat.intAway || "1"))) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p>Aucune statistique disponible pour ce match</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="composition" className="mt-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Spinner className="w-8 h-8" />
              </div>
            ) : lineup.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-6">
                {/* Home Team Lineup */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-bold flex items-center gap-2">
                        <LazyImage src={hbUrl} alt={match.teams.home.name} className="w-6 h-6" />
                        {match.teams.home.name}
                      </h4>
                      <Badge variant="outline">{homeFormation}</Badge>
                    </div>
                    <div className="space-y-2">
                      {homeLineup.map((player) => (
                        <div
                          key={player.idLineup}
                          className="flex items-center justify-between text-sm p-2 bg-muted/30 rounded"
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">
                              {player.intSquadNumber}
                            </span>
                            <span className="font-medium">{player.strPlayer}</span>
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            {player.strPositionShort || player.strPosition}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Away Team Lineup */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-bold flex items-center gap-2">
                        <LazyImage src={abUrl} alt={match.teams.away.name} className="w-6 h-6" />
                        {match.teams.away.name}
                      </h4>
                      <Badge variant="outline">{awayFormation}</Badge>
                    </div>
                    <div className="space-y-2">
                      {awayLineup.map((player) => (
                        <div
                          key={player.idLineup}
                          className="flex items-center justify-between text-sm p-2 bg-muted/30 rounded"
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">
                              {player.intSquadNumber}
                            </span>
                            <span className="font-medium">{player.strPlayer}</span>
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            {player.strPositionShort || player.strPosition}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <UserCircle className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p>Aucune composition disponible pour ce match</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="events" className="mt-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Spinner className="w-8 h-8" />
              </div>
            ) : timeline.length > 0 ? (
              <div className="space-y-3">
                {timeline.map((event, index) => {
                  const isSubstitution =
                    event.strTimeline?.toLowerCase().includes("substitution") ||
                    event.strTimeline?.toLowerCase().includes("liste des remplaçants")
                  const isYellowCard =
                    event.strTimeline?.toLowerCase().includes("yellow") ||
                    event.strTimeline?.toLowerCase().includes("jaune")
                  const isRedCard =
                    event.strTimeline?.toLowerCase().includes("red") ||
                    event.strTimeline?.toLowerCase().includes("rouge")
                  const isGoal =
                    event.strTimeline?.toLowerCase().includes("goal") ||
                    event.strTimeline?.toLowerCase().includes("but")

                  return (
                    <div
                      key={index}
                      className={`flex items-start gap-3 p-3 rounded-lg border-l-4 ${
                        isGoal
                          ? "bg-green-500/10 border-green-500"
                          : isRedCard
                            ? "bg-red-500/10 border-red-500"
                            : isYellowCard
                              ? "bg-yellow-500/10 border-yellow-500"
                              : isSubstitution
                                ? "bg-blue-500/10 border-blue-500"
                                : "bg-muted/50 border-muted"
                      }`}
                    >
                      <Badge variant="outline" className="mt-0.5 min-w-[50px] justify-center">
                        {event.intTime}'
                      </Badge>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {isSubstitution && <span className="text-blue-500">🔄</span>}
                          {isYellowCard && <span className="text-yellow-500">🟨</span>}
                          {isRedCard && <span className="text-red-500">🟥</span>}
                          {isGoal && <span>⚽</span>}
                          <p className="font-semibold text-sm">{event.strTimeline}</p>
                        </div>
                        {event.strTimelineDetail && (
                          <p className="text-xs text-muted-foreground">{event.strTimelineDetail}</p>
                        )}
                        {event.strPlayer && <p className="text-sm text-primary mt-1 font-medium">{event.strPlayer}</p>}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <History className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p>Aucun événement disponible pour ce match</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="timeline" className="mt-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Spinner className="w-8 h-8" />
              </div>
            ) : timeline.length > 0 ? (
              <div className="space-y-3">
                {timeline.map((event, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                    <Badge variant="outline" className="mt-0.5">
                      {event.intTime}'
                    </Badge>
                    <div className="flex-1">
                      <p className="font-semibold">{event.strTimeline}</p>
                      {event.strTimelineDetail && (
                        <p className="text-sm text-muted-foreground">{event.strTimelineDetail}</p>
                      )}
                      {event.strPlayer && <p className="text-sm text-primary mt-1">{event.strPlayer}</p>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Clock className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p>Aucun événement disponible pour ce match</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="tv" className="mt-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Spinner className="w-8 h-8" />
              </div>
            ) : tvBroadcasts.length > 0 ? (
              <div className="grid gap-3 md:grid-cols-2">
                {tvBroadcasts.map((broadcast, index) => (
                  <Card key={index}>
                    <CardContent className="p-4 flex items-center gap-3">
                      {broadcast.strLogo && (
                        <LazyImage
                          src={broadcast.strLogo}
                          alt={broadcast.strChannel}
                          className="w-12 h-12 object-contain"
                        />
                      )}
                      <div className="flex-1">
                        <p className="font-bold">{broadcast.strChannel}</p>
                        <p className="text-sm text-muted-foreground">{broadcast.strCountry}</p>
                      </div>
                      <Tv className="w-5 h-5 text-primary" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Tv className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p>Aucune chaîne TV disponible pour ce match</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="highlights" className="mt-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Spinner className="w-8 h-8" />
              </div>
            ) : highlights.length > 0 ? (
              <div className="space-y-4">
                {highlights.map((highlight, index) => {
                  // Extract YouTube video ID from the URL
                  const videoId = highlight.strVideo?.split("v=")[1]?.split("&")[0]
                  return (
                    <Card key={index}>
                      <CardContent className="p-4">
                        {videoId && (
                          <div className="aspect-video mb-3">
                            <iframe
                              src={`https://www.youtube.com/embed/${videoId}`}
                              className="w-full h-full rounded-lg"
                              allowFullScreen
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            />
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Youtube className="w-5 h-5 text-red-500" />
                          <p className="font-medium">{highlight.strVideoTitle || "Match Highlight"}</p>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Youtube className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p>Aucune vidéo disponible pour ce match</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="info" className="mt-4">
            <div className="space-y-4">
              {eventDetails && (
                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-bold mb-3 flex items-center gap-2">
                      <Trophy className="w-4 h-4" />
                      Détails du Match
                    </h4>
                    {eventDetails.strDescriptionEN && (
                      <p className="text-sm text-muted-foreground mb-2">{eventDetails.strDescriptionEN}</p>
                    )}
                    <div className="grid grid-cols-2 gap-2 text-sm mt-3">
                      {eventDetails.intSpectators && (
                        <div>
                          <span className="text-muted-foreground">Spectateurs:</span>
                          <span className="ml-2 font-semibold">{eventDetails.intSpectators}</span>
                        </div>
                      )}
                      {eventDetails.strLeague && (
                        <div>
                          <span className="text-muted-foreground">Ligue:</span>
                          <span className="ml-2 font-semibold">{eventDetails.strLeague}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {results.length > 0 && (
                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-bold mb-3 flex items-center gap-2">
                      <Award className="w-4 h-4" />
                      Résultats
                    </h4>
                    <div className="space-y-2">
                      {results.map((result, index) => (
                        <div key={index} className="flex items-center justify-between text-sm p-2 bg-muted/30 rounded">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">
                              {result.intPosition}
                            </span>
                            <span className="font-medium">{result.strPlayer}</span>
                          </div>
                          <span className="text-muted-foreground">{result.strResult}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardContent className="p-4">
                  <h4 className="font-bold mb-3 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Équipe Domicile
                  </h4>
                  {match.teams.home.description ? (
                    <p className="text-sm text-muted-foreground line-clamp-3">{match.teams.home.description}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">Aucune information disponible</p>
                  )}
                  {match.teams.home.website && (
                    <a
                      href={`https://${match.teams.home.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline mt-2 inline-block"
                    >
                      Site officiel →
                    </a>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <h4 className="font-bold mb-3 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Équipe Extérieur
                  </h4>
                  {match.teams.away.description ? (
                    <p className="text-sm text-muted-foreground line-clamp-3">{match.teams.away.description}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">Aucune information disponible</p>
                  )}
                  {match.teams.away.website && (
                    <a
                      href={`https://${match.teams.away.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline mt-2 inline-block"
                    >
                      Site officiel →
                    </a>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
