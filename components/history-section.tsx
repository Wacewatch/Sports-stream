"use client"

import { useState, useEffect } from "react"
import { getHistory, type HistoryItem } from "@/lib/storage"
import { Clock, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface HistorySectionProps {
  onMatchClick: (matchId: string) => void
}

export function HistorySection({ onMatchClick }: HistorySectionProps) {
  const [history, setHistory] = useState<HistoryItem[]>([])

  useEffect(() => {
    setHistory(getHistory())
  }, [])

  const clearHistory = () => {
    localStorage.removeItem("sports-stream-history")
    setHistory([])
  }

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Clock className="w-16 h-16 text-muted-foreground/30 mb-4" />
        <h3 className="text-xl font-bold mb-2">Aucun historique</h3>
        <p className="text-muted-foreground">Les matchs que vous regardez apparaîtront ici.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Historique récent
        </h2>
        <button
          onClick={clearHistory}
          className="text-sm text-muted-foreground hover:text-destructive flex items-center gap-1 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          Effacer
        </button>
      </div>

      <div className="space-y-2">
        {history.map((item, index) => (
          <div
            key={`${item.matchId}-${index}`}
            onClick={() => onMatchClick(item.matchId)}
            className={cn(
              "flex items-center gap-4 p-4 rounded-xl bg-card border border-border",
              "cursor-pointer hover:bg-muted transition-colors",
            )}
          >
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-lg">⚽</div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{item.title}</p>
              <p className="text-xs text-muted-foreground">
                {item.sport} •{" "}
                {new Date(item.timestamp).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
