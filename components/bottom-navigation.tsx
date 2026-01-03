"use client"

import { Home, Play, Calendar, User } from "lucide-react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

interface BottomNavigationProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

const tabs = [
  { id: "home", icon: Home, label: "Accueil" },
  { id: "live", icon: Play, label: "Live" },
  { id: "calendar", icon: Calendar, label: "Calendrier" },
  { id: "profile", icon: User, label: "Ma Page", isRoute: true },
]

export function BottomNavigation({ activeTab, onTabChange }: BottomNavigationProps) {
  const router = useRouter()

  const handleTabClick = (tab: (typeof tabs)[0]) => {
    if (tab.isRoute) {
      router.push("/profile")
    } else {
      onTabChange(tab.id)
    }
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-xl border-t border-border safe-area-bottom md:hidden">
      <div className="flex items-center justify-around h-16">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 flex-1 h-full transition-all touch-manipulation",
                isActive ? "text-primary" : "text-muted-foreground",
              )}
            >
              <Icon className={cn("w-5 h-5 transition-transform", isActive && "scale-110")} />
              <span className="text-[10px] font-medium">{tab.label}</span>
              {isActive && <span className="absolute bottom-1 w-1 h-1 bg-primary rounded-full" />}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
