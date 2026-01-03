"use client"

import { AlertTriangle, Info } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { cn } from "@/lib/utils"

interface FictionalBettingWarningProps {
  variant?: "default" | "prominent" | "inline"
  className?: string
}

export function FictionalBettingWarning({ variant = "default", className }: FictionalBettingWarningProps) {
  if (variant === "prominent") {
    return (
      <div
        className={cn(
          "bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-red-500/20 border-2 border-amber-500/50 rounded-xl p-6 shadow-lg",
          className,
        )}
      >
        <div className="flex items-start gap-4">
          <div className="p-3 bg-amber-500/20 rounded-full">
            <AlertTriangle className="w-8 h-8 text-amber-500 animate-pulse" />
          </div>
          <div className="flex-1 space-y-2">
            <h3 className="text-xl font-black text-amber-500 flex items-center gap-2">AVERTISSEMENT - Paris Fictifs</h3>
            <p className="text-base font-semibold text-foreground leading-relaxed">
              Tous les paris sur cette plateforme sont{" "}
              <span className="text-amber-500 font-black">100% FICTIFS et GRATUITS</span>. Aucun argent réel n&apos;est
              impliqué. Cette application est uniquement à des fins de{" "}
              <span className="text-primary font-bold">divertissement et d&apos;apprentissage</span>.
            </p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Info className="w-4 h-4" />
              <span>Vous ne pouvez ni perdre ni gagner de l&apos;argent réel</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (variant === "inline") {
    return (
      <div className={cn("flex items-center gap-2 text-sm text-amber-500 font-semibold", className)}>
        <AlertTriangle className="w-4 h-4 animate-pulse" />
        <span>Paris fictifs uniquement - Pas d&apos;argent réel</span>
      </div>
    )
  }

  return (
    <Alert className={cn("border-amber-500/50 bg-amber-500/10", className)}>
      <AlertTriangle className="h-5 w-5 text-amber-500" />
      <AlertDescription className="font-semibold text-foreground ml-2">
        <span className="text-amber-500 font-black">PARIS FICTIFS :</span> Cette plateforme utilise uniquement de
        l&apos;argent virtuel. Aucun pari réel n&apos;est effectué.
      </AlertDescription>
    </Alert>
  )
}
