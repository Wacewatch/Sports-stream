"use client"

import { useState, useEffect, useCallback } from "react"

interface MiniGameProps {
  onComplete?: () => void
}

export function MiniGame({ onComplete }: MiniGameProps) {
  const [score, setScore] = useState(0)
  const [ballPosition, setBallPosition] = useState({ x: 50, y: 50 })
  const [isPlaying, setIsPlaying] = useState(false)

  const moveBall = useCallback(() => {
    setBallPosition({
      x: Math.random() * 80 + 10,
      y: Math.random() * 80 + 10,
    })
  }, [])

  useEffect(() => {
    if (!isPlaying) return
    const interval = setInterval(moveBall, 1000)
    return () => clearInterval(interval)
  }, [isPlaying, moveBall])

  const handleClick = () => {
    if (!isPlaying) {
      setIsPlaying(true)
      setScore(0)
      moveBall()
    } else {
      setScore((s) => s + 1)
      moveBall()
      if (score >= 4 && onComplete) {
        onComplete()
      }
    }
  }

  return (
    <div className="w-full max-w-xs mx-auto p-4">
      <div className="text-center mb-3">
        <p className="text-sm text-muted-foreground mb-1">Mini-jeu pendant le chargement</p>
        <p className="text-lg font-bold text-primary">Score: {score}</p>
      </div>

      <div
        className="relative w-full aspect-square bg-muted/30 rounded-xl border border-border overflow-hidden cursor-pointer"
        onClick={handleClick}
      >
        {!isPlaying ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <span className="text-4xl">⚽</span>
            <span className="text-sm text-muted-foreground">Cliquez pour jouer !</span>
          </div>
        ) : (
          <div
            className="absolute w-12 h-12 transform -translate-x-1/2 -translate-y-1/2 transition-all duration-200 hover:scale-125"
            style={{ left: `${ballPosition.x}%`, top: `${ballPosition.y}%` }}
          >
            <span className="text-3xl animate-bounce">⚽</span>
          </div>
        )}
      </div>

      <p className="text-xs text-center text-muted-foreground mt-2">
        {isPlaying ? "Attrapez le ballon !" : "Cliquez pour démarrer"}
      </p>
    </div>
  )
}
