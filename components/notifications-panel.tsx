"use client"

import { useEffect, useState } from "react"
import { X, Bell, TrendingUp, Heart, Play } from "lucide-react"
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead } from "@/lib/storage"
import { cn } from "@/lib/utils"

interface NotificationsPanelProps {
  isOpen: boolean
  onClose: () => void
}

export function NotificationsPanel({ isOpen, onClose }: NotificationsPanelProps) {
  const [notifications, setNotifications] = useState<any[]>([])

  useEffect(() => {
    if (isOpen) {
      setNotifications(getNotifications())
    }
  }, [isOpen])

  const handleMarkAsRead = (id: string) => {
    markNotificationAsRead(id)
    setNotifications(getNotifications())
  }

  const handleMarkAllAsRead = () => {
    markAllNotificationsAsRead()
    setNotifications(getNotifications())
  }

  if (!isOpen) return null

  const getIcon = (type: string) => {
    switch (type) {
      case "bet_placed":
      case "bet_won":
      case "bet_lost":
        return <TrendingUp className="w-5 h-5" />
      case "favorite_starting":
        return <Heart className="w-5 h-5 fill-current" />
      case "match_live":
        return <Play className="w-5 h-5" />
      default:
        return <Bell className="w-5 h-5" />
    }
  }

  const getColor = (type: string) => {
    switch (type) {
      case "bet_won":
        return "text-green-500 bg-green-500/10"
      case "bet_lost":
        return "text-red-500 bg-red-500/10"
      case "bet_placed":
        return "text-amber-500 bg-amber-500/10"
      case "favorite_starting":
        return "text-pink-500 bg-pink-500/10"
      case "match_live":
        return "text-blue-500 bg-blue-500/10"
      default:
        return "text-primary bg-primary/10"
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-50" onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-background border-l border-border z-50 flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-xl font-black">Notifications</h2>
          <div className="flex items-center gap-2">
            {notifications.length > 0 && (
              <button onClick={handleMarkAllAsRead} className="text-sm text-primary hover:underline">
                Tout marquer lu
              </button>
            )}
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {notifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">Aucune notification</p>
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => handleMarkAsRead(notif.id)}
                className={cn(
                  "p-4 rounded-lg border transition-all cursor-pointer",
                  notif.read ? "bg-background border-border" : "bg-primary/5 border-primary",
                )}
              >
                <div className="flex items-start gap-3">
                  <div className={cn("p-2 rounded-lg", getColor(notif.type))}>{getIcon(notif.type)}</div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm mb-1">{notif.title}</h3>
                    <p className="text-sm text-muted-foreground mb-2">{notif.message}</p>
                    <p className="text-xs text-muted-foreground">{new Date(notif.timestamp).toLocaleString("fr-FR")}</p>
                  </div>
                  {!notif.read && <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-2" />}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  )
}
