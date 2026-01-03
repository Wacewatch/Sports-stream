"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { X, Calendar, Clock, MapPin, Trophy, Users, TrendingUp, Info, FileText } from "lucide-react"
import type { Match } from "@/types/match"
import { lookupEvent, getEventStats, getEventLineup, getEventTimeline } from "@/lib/sportsdb"
import type { SportsDBEvent, SportsDBEventStats, SportsDBLineup, SportsDBEventTimeline } from "@/lib/sportsdb"
import { IMG_URL } from "@/lib/api"

interface MatchInfoModalProps {
  match: Match
  onClose: () => void
}

export function MatchInfoModal({ match, onClose }: MatchInfoModalProps) {
  const [eventDetails, setEventDetails] = useState<SportsDBEvent | null>(null)
  const [stats, setStats] = useState<SportsDBEventStats[]>([])
  const [lineup, setLineup] = useState<SportsDBLineup[]>([])
  const [timeline, setTimeline] = useState<SportsDBEventTimeline[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadEventDetails()
  }, [match.sportsDbEventId])

  const loadEventDetails = async () => {
    if (!match.sportsDbEventId) {
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const [eventData, statsData, lineupData, timelineData] = await Promise.all([
        lookupEvent(match.sportsDbEventId),
        getEventStats(match.sportsDbEventId),
        getEventLineup(match.sportsDbEventId),
        getEventTimeline(match.sportsDbEventId),
      ])

      setEventDetails(eventData)
      setStats(statsData)
      setLineup(lineupData)
      setTimeline(timelineData)
    } catch (error) {
      console.error("[v0] Error loading event details:", error)
    } finally {
      setLoading(false)
    }
  }

  const homeBadge = match.teams?.home?.badge
  const awayBadge = match.teams?.away?.badge
  const SITE_LOGO = "https://i.imgur.com/zdFYbFp.png?v=1"
  const hbUrl = homeBadge ? `${IMG_URL}/badge/${homeBadge}.webp` : SITE_LOGO
  const abUrl = awayBadge ? `${IMG_URL}/badge/${awayBadge}.webp` : SITE_LOGO

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent
        className="!max-w-[95vw] sm:!max-w-4xl !h-[90vh] p-0 overflow-hidden flex flex-col"
        showCloseButton={false}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-background to-muted/30">
          <div className="flex items-center gap-3">
            <Info className="w-6 h-6 text-primary" />
            <div>
              <h2 className="text-xl font-black">{match.title}</h2>
              <p className="text-sm text-muted-foreground">{match.league || match.sport_name}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
                <p className="text-muted-foreground">Chargement des détails...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Teams and Score */}
              <Card className="p-6">
                <div className="flex items-center justify-between gap-6">
                  <div className="flex-1 text-center">
                    <div className="w-20 h-20 mx-auto mb-3 flex items-center justify-center">
                      <img
                        src={hbUrl || "/placeholder.svg"}
                        alt={match.teams?.home?.name || "Home Team"}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          e.currentTarget.src = SITE_LOGO
                        }}
                      />
                    </div>
                    <h3 className="font-bold text-lg">{match.teams?.home?.name || "Home"}</h3>
                  </div>

                  <div className="text-center">
                    {match.score?.home !== undefined && match.score?.away !== undefined ? (
                      <div className="text-4xl font-black text-primary">
                        {match.score.home} - {match.score.away}
                      </div>
                    ) : (
                      <div className="text-2xl font-bold text-muted-foreground">vs</div>
                    )}
                    <Badge variant={match.status === "live" ? "destructive" : "secondary"} className="mt-2">
                      {match.status === "live" ? "En Direct" : match.status === "finished" ? "Terminé" : "À venir"}
                    </Badge>
                  </div>

                  <div className="flex-1 text-center">
                    <div className="w-20 h-20 mx-auto mb-3 flex items-center justify-center">
                      <img
                        src={abUrl || "/placeholder.svg"}
                        alt={match.teams?.away?.name || "Away Team"}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          e.currentTarget.src = SITE_LOGO
                        }}
                      />
                    </div>
                    <h3 className="font-bold text-lg">{match.teams?.away?.name || "Away"}</h3>
                  </div>
                </div>
              </Card>

              {/* Match Information */}
              {eventDetails && (
                <Card className="p-6 space-y-4">
                  <h3 className="text-lg font-black flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Informations du match
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    {eventDetails.dateEvent && (
                      <div className="flex items-start gap-2">
                        <Calendar className="w-4 h-4 mt-0.5 text-muted-foreground" />
                        <div>
                          <div className="font-semibold">Date</div>
                          <div className="text-muted-foreground">
                            {new Date(eventDetails.dateEvent).toLocaleDateString("fr-FR", {
                              weekday: "long",
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </div>
                        </div>
                      </div>
                    )}

                    {eventDetails.strTime && (
                      <div className="flex items-start gap-2">
                        <Clock className="w-4 h-4 mt-0.5 text-muted-foreground" />
                        <div>
                          <div className="font-semibold">Heure</div>
                          <div className="text-muted-foreground">{eventDetails.strTime}</div>
                        </div>
                      </div>
                    )}

                    {eventDetails.strLeague && (
                      <div className="flex items-start gap-2">
                        <Trophy className="w-4 h-4 mt-0.5 text-muted-foreground" />
                        <div>
                          <div className="font-semibold">Compétition</div>
                          <div className="text-muted-foreground">{eventDetails.strLeague}</div>
                        </div>
                      </div>
                    )}

                    {eventDetails.strSeason && (
                      <div className="flex items-start gap-2">
                        <TrendingUp className="w-4 h-4 mt-0.5 text-muted-foreground" />
                        <div>
                          <div className="font-semibold">Saison</div>
                          <div className="text-muted-foreground">{eventDetails.strSeason}</div>
                        </div>
                      </div>
                    )}

                    {eventDetails.strVenue && (
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 mt-0.5 text-muted-foreground" />
                        <div>
                          <div className="font-semibold">Stade</div>
                          <div className="text-muted-foreground">{eventDetails.strVenue}</div>
                        </div>
                      </div>
                    )}

                    {eventDetails.intSpectators && (
                      <div className="flex items-start gap-2">
                        <Users className="w-4 h-4 mt-0.5 text-muted-foreground" />
                        <div>
                          <div className="font-semibold">Spectateurs</div>
                          <div className="text-muted-foreground">
                            {Number.parseInt(eventDetails.intSpectators).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {eventDetails.strDescriptionEN && (
                    <div className="pt-4 border-t">
                      <div className="font-semibold mb-2">Description</div>
                      <p className="text-sm text-muted-foreground">{eventDetails.strDescriptionEN}</p>
                    </div>
                  )}
                </Card>
              )}

              {/* Statistics */}
              {stats.length > 0 && (
                <Card className="p-6">
                  <h3 className="text-lg font-black mb-4">Statistiques</h3>
                  <div className="space-y-3">
                    {stats.map((stat, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm">
                        <div className="font-semibold w-12 text-center">{stat.intHome}</div>
                        <div className="flex-1 text-center text-muted-foreground">{stat.strStat}</div>
                        <div className="font-semibold w-12 text-center">{stat.intAway}</div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Lineup */}
              {lineup.length > 0 && (
                <Card className="p-6">
                  <h3 className="text-lg font-black mb-4">Composition</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Home Team Lineup */}
                    <div>
                      <h4 className="font-bold mb-3">{match.teams?.home?.name || "Home"}</h4>
                      <div className="space-y-2">
                        {lineup
                          .filter((player) => player.strTeam === match.teams?.home?.name)
                          .map((player, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-sm">
                              <Badge variant="outline" className="w-8 shrink-0">
                                {player.intSquadNumber}
                              </Badge>
                              <div className="flex-1">
                                <div className="font-medium">{player.strPlayer}</div>
                                <div className="text-xs text-muted-foreground">{player.strPosition}</div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>

                    {/* Away Team Lineup */}
                    <div>
                      <h4 className="font-bold mb-3">{match.teams?.away?.name || "Away"}</h4>
                      <div className="space-y-2">
                        {lineup
                          .filter((player) => player.strTeam === match.teams?.away?.name)
                          .map((player, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-sm">
                              <Badge variant="outline" className="w-8 shrink-0">
                                {player.intSquadNumber}
                              </Badge>
                              <div className="flex-1">
                                <div className="font-medium">{player.strPlayer}</div>
                                <div className="text-xs text-muted-foreground">{player.strPosition}</div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                </Card>
              )}

              {/* Timeline */}
              {timeline.length > 0 && (
                <Card className="p-6">
                  <h3 className="text-lg font-black mb-4">Chronologie</h3>
                  <div className="space-y-3">
                    {timeline.map((event, idx) => (
                      <div key={idx} className="flex items-start gap-3 text-sm">
                        <Badge variant="secondary" className="shrink-0">
                          {event.intTime}'
                        </Badge>
                        <div className="flex-1">
                          <div className="font-medium">{event.strTimeline}</div>
                          {event.strPlayer && <div className="text-muted-foreground">{event.strPlayer}</div>}
                          {event.strTimelineDetail && (
                            <div className="text-xs text-muted-foreground mt-1">{event.strTimelineDetail}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
