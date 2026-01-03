"use client"

export function generateViewerCount(matchId: string, isLive: boolean, popular: boolean): number {
  const hash = matchId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const base = hash % 5000

  if (isLive) {
    return popular ? base + 15000 + Math.floor(Math.random() * 10000) : base + 2000 + Math.floor(Math.random() * 5000)
  }
  return popular ? base + 500 + Math.floor(Math.random() * 1000) : base + 100 + Math.floor(Math.random() * 500)
}

export function generateTotalViewers(): number {
  return 47000 + Math.floor(Math.random() * 15000)
}

export function formatViewers(count: number): string {
  if (count >= 1000000) {
    return (count / 1000000).toFixed(1) + "M"
  }
  if (count >= 1000) {
    return (count / 1000).toFixed(1) + "K"
  }
  return count.toString()
}
