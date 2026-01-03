import { createBrowserClient } from "@supabase/ssr"

const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export interface UserProfile {
  id: string
  user_id: string
  username: string
  points: number
  total_bets: number
  won_bets: number
  lost_bets: number
  pending_bets: number
  total_winnings: number
  total_losses: number
  favorite_sport?: string
  created_at: string
  updated_at: string
}

// Get or create user profile
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const { data, error } = await supabase.from("user_profiles").select("*").eq("user_id", userId).maybeSingle()

    if (error && error.code !== "PGRST116") {
      console.error("[Profile] Error fetching profile:", error)
      return null
    }

    // If no profile exists, create one
    if (!data) {
      const newProfile = {
        user_id: userId,
        username: `User${userId.slice(0, 6)}`,
        points: 1000,
        total_bets: 0,
        won_bets: 0,
        lost_bets: 0,
        pending_bets: 0,
        total_winnings: 0,
        total_losses: 0,
      }

      const { data: created, error: createError } = await supabase
        .from("user_profiles")
        .insert(newProfile)
        .select()
        .single()

      if (createError) {
        console.error("[Profile] Error creating profile:", createError)
        return null
      }

      return created
    }

    return data
  } catch (error) {
    console.error("[Profile] Error in getUserProfile:", error)
    return null
  }
}

// Update profile points
export async function updateUserPoints(userId: string, points: number): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("user_profiles")
      .update({ points, updated_at: new Date().toISOString() })
      .eq("user_id", userId)

    if (error) {
      console.error("[Profile] Error updating points:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("[Profile] Error in updateUserPoints:", error)
    return false
  }
}

// Get leaderboard
export async function getLeaderboard(limit = 10): Promise<UserProfile[]> {
  try {
    const { data, error } = await supabase
      .from("user_profiles")
      .select("*")
      .order("points", { ascending: false })
      .limit(limit)

    if (error) {
      console.error("[Profile] Error fetching leaderboard:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("[Profile] Error in getLeaderboard:", error)
    return []
  }
}

// Update profile statistics
export async function updateProfileStats(userId: string, stats: Partial<UserProfile>): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("user_profiles")
      .update({ ...stats, updated_at: new Date().toISOString() })
      .eq("user_id", userId)

    if (error) {
      console.error("[Profile] Error updating stats:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("[Profile] Error in updateProfileStats:", error)
    return false
  }
}
