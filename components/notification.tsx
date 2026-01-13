"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { X, CheckCircle, AlertCircle, Info, Bell, Gift } from "lucide-react"

export type NotificationType = "success" | "error" | "info" | "reminder" | "ad" | "match_live"

interface NotificationProps {
  id: string
  type: NotificationType
  title: string
  message?: string
  onClose: (id: string) => void
  onClick?: () => void
}

const icons = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
  reminder: Bell,
  ad: Gift,
  match_live: Bell,
}

const colors = {
  success: "border-green-500 bg-green-500/10",
  error: "border-red-500 bg-red-500/10",
  info: "border-blue-500 bg-blue-500/10",
  reminder: "border-amber-500 bg-amber-500/10",
  ad: "border-red-500 bg-gradient-to-r from-red-500/20 to-red-600/20 animate-pulse",
  match_live: "border-red-500 bg-red-500/10",
}

const iconColors = {
  success: "text-green-500",
  error: "text-red-500",
  info: "text-blue-500",
  reminder: "text-amber-500",
  ad: "text-red-500",
  match_live: "text-red-500",
}

export function Notification({ id, type, title, message, onClose, onClick }: NotificationProps) {
  const [isExiting, setIsExiting] = useState(false)
  const [isBlinking, setIsBlinking] = useState(true)
  const Icon = icons[type]

  useEffect(() => {
    const timeout = type === "ad" ? 20000 : type === "reminder" ? 12000 : 5000
    const timer = setTimeout(() => {
      setIsExiting(true)
      setTimeout(() => onClose(id), 300)
    }, timeout)

    return () => clearTimeout(timer)
  }, [id, onClose, type])

  useEffect(() => {
    if (type === "ad") {
      const blinkInterval = setInterval(() => {
        setIsBlinking((prev) => !prev)
      }, 500)
      return () => clearInterval(blinkInterval)
    }
  }, [type])

  const handleClick = () => {
    if (onClick) {
      onClick()
      setIsExiting(true)
      setTimeout(() => onClose(id), 300)
    }
  }

  return (
    <div
      onClick={handleClick}
      className={cn(
        "flex items-start gap-3 p-4 rounded-xl border backdrop-blur-xl shadow-lg transition-all duration-300 min-w-[300px] max-w-[380px]",
        colors[type],
        isExiting ? "opacity-0 translate-x-full" : "opacity-100 translate-x-0 animate-in slide-in-from-right",
        onClick && "cursor-pointer hover:scale-[1.02] hover:shadow-xl active:scale-[0.98]",
        type === "ad" && isBlinking && "ring-2 ring-red-500 shadow-red-500/50 shadow-xl",
        type === "ad" && !isBlinking && "ring-1 ring-red-500/50",
      )}
    >
      <div
        className={cn(
          "p-2 rounded-full transition-all duration-300",
          type === "ad" ? "bg-red-500/20" : "bg-muted",
          type === "ad" && isBlinking && "bg-red-500/40 scale-110",
        )}
      >
        <Icon className={cn("w-5 h-5 flex-shrink-0", iconColors[type])} />
      </div>
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "font-bold text-sm text-foreground leading-tight",
            type === "ad" && isBlinking && "text-red-400",
          )}
        >
          {title}
        </p>
        {message && <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{message}</p>}
        {type === "ad" && (
          <div className="mt-2 flex items-center gap-2">
            <span
              className={cn(
                "text-xs font-bold transition-all duration-300",
                isBlinking ? "text-red-400 scale-105" : "text-red-500",
              )}
            >
              👆 Cliquez ici pour nous soutenir !
            </span>
          </div>
        )}
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation()
          setIsExiting(true)
          setTimeout(() => onClose(id), 300)
        }}
        className="p-1.5 hover:bg-muted rounded-full transition-colors flex-shrink-0"
        aria-label="Fermer"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

interface NotificationContainerProps {
  notifications: Array<{
    id: string
    type: NotificationType
    title: string
    message?: string
    onClick?: () => void
  }>
  onClose: (id: string) => void
}

export function NotificationContainer({ notifications, onClose }: NotificationContainerProps) {
  return (
    <div className="fixed top-16 sm:top-20 right-2 sm:right-4 z-[60] flex flex-col gap-2 sm:gap-3 max-w-[calc(100vw-1rem)] sm:max-w-sm w-full pointer-events-none">
      {notifications.map((notif) => (
        <div key={notif.id} className="pointer-events-auto">
          <Notification {...notif} onClose={onClose} />
        </div>
      ))}
    </div>
  )
}
