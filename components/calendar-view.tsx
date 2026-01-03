"use client"

import { useState, useEffect } from "react"
import { CalendarIcon, ChevronLeft, ChevronRight, Clock, MapPin, Trophy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getEventsForDay } from "@/lib/sportsdb"
import type { SportsDBEvent } from "@/lib/sportsdb"
import { cn } from "@/lib/utils"
import { MatchInfoModal } from "@/components/match-info-modal"
import type { Match } from "@/types/match"

export function CalendarView() {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [events, setEvents] = useState<SportsDBEvent[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null)

  useEffect(() => {
    loadEvents()
  }, [selectedDate])

  const loadEvents = async () => {
    setLoading(true)
    try {
      const dateEvents = await getEventsForDay(selectedDate)
      setEvents(dateEvents)
      console.log("[v0] Calendar events loaded:", dateEvents.length)
    } catch (error) {
      console.error("[v0] Error loading calendar events:", error)
    } finally {
      setLoading(false)
    }
  }

  const changeDate = (days: number) => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() + days)
    setSelectedDate(newDate)
  }

  const goToToday = () => {
    setSelectedDate(new Date())
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    )
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("fr-FR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date)
  }

  const getEventStatus = (event: SportsDBEvent) => {
    const now = new Date()
    const eventDate = new Date(event.dateEvent)

    // If event has a time, parse it
    if (event.strTime) {
      const [hours, minutes] = event.strTime.split(":").map(Number)
      eventDate.setHours(hours, minutes, 0, 0)
    }

    // Check if finished based on status OR if event was more than 3 hours ago
    if (event.strStatus === "Match Finished" || event.intHomeScore !== null) {
      return "finished"
    }

    // Check if live: within 3 hours after start time
    const diffMs = now.getTime() - eventDate.getTime()
    const diffHours = diffMs / (1000 * 60 * 60)

    if (diffHours >= 0 && diffHours <= 3) {
      return "live"
    }

    // If event is in the future
    if (eventDate > now) {
      return "upcoming"
    }

    // Default to finished for past events
    return "finished"
  }

  const getSportColor = (sport: string) => {
    const colors: Record<string, string> = {
      Soccer: "bg-green-500/10 text-green-500",
      Basketball: "bg-orange-500/10 text-orange-500",
      Football: "bg-blue-500/10 text-blue-500",
      "American Football": "bg-red-500/10 text-red-500",
      Hockey: "bg-cyan-500/10 text-cyan-500",
      Baseball: "bg-yellow-500/10 text-yellow-500",
      Tennis: "bg-purple-500/10 text-purple-500",
      Cricket: "bg-pink-500/10 text-pink-500",
    }
    return colors[sport] || "bg-gray-500/10 text-gray-500"
  }

  const convertEventToMatch = (event: SportsDBEvent): Match => {
    return {
      id: event.idEvent,
      title: `${event.strHomeTeam} vs ${event.strAwayTeam}`,
      sport_name: event.strSport,
      date: event.dateEvent,
      time: event.strTime || "",
      status:
        event.strStatus === "Match Finished" ? "finished" : event.strStatus === "Not Started" ? "upcoming" : "live",
      teams: {
        home: {
          name: event.strHomeTeam,
          badge: event.strHomeTeamBadge || "",
        },
        away: {
          name: event.strAwayTeam,
          badge: event.strAwayTeamBadge || "",
        },
      },
      score: {
        home: event.intHomeScore ? Number.parseInt(event.intHomeScore) : undefined,
        away: event.intAwayScore ? Number.parseInt(event.intAwayScore) : undefined,
      },
      league: event.strLeague || "",
      sources: [],
      sportsDbEventId: event.idEvent,
    }
  }

  return (
    <div className="py-8 px-4 md:px-0">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-black mb-2 flex items-center gap-3">
          <CalendarIcon className="w-8 h-8" />
          Calendrier des matchs
        </h1>
        <p className="text-muted-foreground">Tous les matchs passés et à venir</p>
      </div>

      {/* Date Navigation */}
      <Card className="p-4 mb-6">
        <div className="flex items-center justify-between gap-4">
          <Button onClick={() => changeDate(-1)} variant="outline" size="sm">
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline ml-1">Jour précédent</span>
          </Button>

          <div className="flex-1 text-center">
            <div className="font-bold text-lg capitalize">{formatDate(selectedDate)}</div>
            {!isToday(selectedDate) && (
              <Button onClick={goToToday} variant="link" size="sm" className="text-xs">
                Aujourd'hui
              </Button>
            )}
          </div>

          <Button onClick={() => changeDate(1)} variant="outline" size="sm">
            <span className="hidden sm:inline mr-1">Jour suivant</span>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </Card>

      {/* Events List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Chargement des matchs...</p>
        </div>
      ) : events.length === 0 ? (
        <Card className="p-12 text-center">
          <CalendarIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-xl font-bold mb-2">Aucun match ce jour</h3>
          <p className="text-muted-foreground">Essayez une autre date</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {events.map((event) => {
            const status = getEventStatus(event)
            const hasScore = event.intHomeScore !== null && event.intAwayScore !== null

            return (
              <Card
                key={event.idEvent}
                className="p-4 hover:shadow-lg transition-all cursor-pointer hover:scale-[1.02]"
                onClick={() => setSelectedMatch(convertEventToMatch(event))}
              >
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Time & Status */}
                  <div className="flex-shrink-0 sm:w-32">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <Clock className="w-4 h-4" />
                      {event.strTime || "TBD"}
                    </div>
                    {status === "live" && (
                      <Badge variant="destructive" className="animate-pulse">
                        <span className="w-2 h-2 bg-white rounded-full mr-1" />
                        En Direct
                      </Badge>
                    )}
                    {status === "finished" && <Badge variant="secondary">Terminé</Badge>}
                    {status === "upcoming" && <Badge variant="outline">À venir</Badge>}
                  </div>

                  {/* Match Details */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={cn("text-xs", getSportColor(event.strSport))}>{event.strSport}</Badge>
                      {event.strLeague && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Trophy className="w-3 h-3" />
                          {event.strLeague}
                        </div>
                      )}
                    </div>

                    {/* Teams */}
                    <div className="font-bold text-lg mb-1">
                      {event.strHomeTeam} vs {event.strAwayTeam}
                    </div>

                    {/* Score */}
                    {hasScore && (
                      <div className="text-2xl font-black text-primary mb-2">
                        {event.intHomeScore} - {event.intAwayScore}
                      </div>
                    )}

                    {/* Additional Info */}
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                      {event.strSeason && <span>Saison: {event.strSeason}</span>}
                      {event.strVenue && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {event.strVenue}
                        </span>
                      )}
                      {event.intSpectators && (
                        <span>{Number.parseInt(event.intSpectators).toLocaleString()} spectateurs</span>
                      )}
                    </div>

                    {/* Description */}
                    {event.strDescriptionEN && (
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{event.strDescriptionEN}</p>
                    )}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* MatchInfoModal for calendar events */}
      {selectedMatch && <MatchInfoModal match={selectedMatch} onClose={() => setSelectedMatch(null)} />}
    </div>
  )
}
