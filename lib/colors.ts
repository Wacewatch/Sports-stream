export function getBettingColor(teamName: string): string {
  const hash = teamName.split("").reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc)
  }, 0)

  const hue = Math.abs(hash % 360)
  const saturation = 65 + (Math.abs(hash) % 20)
  const lightness = 45 + (Math.abs(hash) % 15)

  return `hsl(${hue}, ${saturation}%, ${lightness}%)`
}

export function getTeamColor(teamName: string, variant: "primary" | "secondary" = "primary"): string {
  const teamColors: Record<string, { primary: string; secondary: string }> = {
    // Football
    barcelona: { primary: "#A50044", secondary: "#004D98" },
    "real madrid": { primary: "#FEBE10", secondary: "#00529F" },
    manchester: { primary: "#DA291C", secondary: "#FBE122" },
    liverpool: { primary: "#C8102E", secondary: "#00B2A9" },
    chelsea: { primary: "#034694", secondary: "#DBA111" },
    arsenal: { primary: "#EF0107", secondary: "#063672" },
    "bayern munich": { primary: "#DC052D", secondary: "#0066B2" },
    juventus: { primary: "#000000", secondary: "#FFFFFF" },
    psg: { primary: "#004170", secondary: "#DA291C" },
    "paris saint-germain": { primary: "#004170", secondary: "#DA291C" },

    // Basketball
    lakers: { primary: "#552583", secondary: "#FDB927" },
    celtics: { primary: "#007A33", secondary: "#BA9653" },
    warriors: { primary: "#1D428A", secondary: "#FFC72C" },
    bulls: { primary: "#CE1141", secondary: "#000000" },
    heat: { primary: "#98002E", secondary: "#F9A01B" },

    // Hockey
    canadiens: { primary: "#AF1E2D", secondary: "#192168" },
    "maple leafs": { primary: "#00205B", secondary: "#FFFFFF" },
    bruins: { primary: "#FFB81C", secondary: "#000000" },
    blackhawks: { primary: "#CF0A2C", secondary: "#000000" },

    // Default colors
    default: { primary: "#3B82F6", secondary: "#8B5CF6" },
  }

  const normalizedTeamName = teamName.toLowerCase()

  for (const [key, colors] of Object.entries(teamColors)) {
    if (normalizedTeamName.includes(key)) {
      return colors[variant]
    }
  }

  return getBettingColor(teamName)
}

export function getSportColor(sport: string): string {
  const sportColors: Record<string, string> = {
    football: "#10B981",
    soccer: "#10B981",
    basketball: "#F59E0B",
    hockey: "#3B82F6",
    tennis: "#8B5CF6",
    baseball: "#EF4444",
    cricket: "#14B8A6",
    "american football": "#DC2626",
    rugby: "#059669",
    golf: "#84CC16",
    fight: "#DC2626",
    boxing: "#DC2626",
    mma: "#DC2626",
    darts: "#F97316",
    other: "#6B7280",
  }

  return sportColors[sport.toLowerCase()] || sportColors.other
}
