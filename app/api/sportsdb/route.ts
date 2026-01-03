import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase-server"

const SPORTSDB_API_BASE = "https://www.thesportsdb.com/api/v1/json/123"
const SPORTSDB_TV_API_BASE = "https://www.thesportsdb.com/api/v1/json/3"

const MAX_RETRIES = 2
const RETRY_DELAY = 2000
const REQUEST_DELAY = 2000
const CACHE_DURATION = 300000

let lastRequestTime = 0
let requestCount = 0
const REQUEST_WINDOW = 60000

async function delayRequest() {
  const now = Date.now()
  const timeSinceLastRequest = now - lastRequestTime

  if (timeSinceLastRequest < REQUEST_DELAY) {
    await new Promise((resolve) => setTimeout(resolve, REQUEST_DELAY - timeSinceLastRequest))
  }

  if (requestCount >= 25 && now - lastRequestTime < REQUEST_WINDOW) {
    const waitTime = REQUEST_WINDOW - (now - lastRequestTime)
    console.log(`[v0] Rate limit approaching, waiting ${waitTime}ms`)
    await new Promise((resolve) => setTimeout(resolve, waitTime))
    requestCount = 0
  }

  lastRequestTime = Date.now()
  requestCount++
}

async function getCachedData(supabase: any, cacheKey: string) {
  try {
    const { data, error } = await supabase
      .from("api_cache")
      .select("data, expires_at")
      .eq("cache_key", cacheKey)
      .maybeSingle()

    if (error || !data) return null

    if (new Date(data.expires_at) > new Date()) {
      console.log(`[v0] Cache HIT for ${cacheKey}`)
      return data.data
    }

    await supabase.from("api_cache").delete().eq("cache_key", cacheKey)
    console.log(`[v0] Cache EXPIRED for ${cacheKey}`)
    return null
  } catch (error) {
    console.error("[v0] Cache read error:", error)
    return null
  }
}

async function setCachedData(supabase: any, cacheKey: string, data: any) {
  try {
    const expiresAt = new Date(Date.now() + CACHE_DURATION)

    await supabase.from("api_cache").upsert(
      {
        cache_key: cacheKey,
        data: data,
        expires_at: expiresAt.toISOString(),
      },
      { onConflict: "cache_key" },
    )

    console.log(`[v0] Cache SET for ${cacheKey}, expires at ${expiresAt.toISOString()}`)
  } catch (error) {
    console.error("[v0] Cache write error:", error)
  }
}

async function logRequest(supabase: any, endpoint: string, success: boolean, statusCode: number, fromCache: boolean) {
  try {
    await supabase.from("api_request_log").insert({
      endpoint,
      success,
      status_code: statusCode,
      from_cache: fromCache,
    })
  } catch (error) {
    console.error("[v0] Request log error:", error)
  }
}

async function fetchWithRetry(url: string, retries = MAX_RETRIES): Promise<Response | null> {
  await delayRequest()

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (response.status === 404) {
        return null
      }

      if (response.status === 429) {
        if (attempt < retries) {
          const delay = RETRY_DELAY * (attempt + 1) * 2
          console.log(`[v0] Rate limited (429), waiting ${delay}ms before retry ${attempt + 1}`)
          await new Promise((resolve) => setTimeout(resolve, delay))
          continue
        }
        return null
      }

      if (!response.ok) {
        if (attempt < retries) {
          const delay = RETRY_DELAY * (attempt + 1)
          await new Promise((resolve) => setTimeout(resolve, delay))
          continue
        }
        return null
      }

      return response
    } catch (error) {
      if (attempt < retries) {
        const delay = RETRY_DELAY * (attempt + 1)
        await new Promise((resolve) => setTimeout(resolve, delay))
        continue
      }
      return null
    }
  }

  return null
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const endpoint = searchParams.get("endpoint")
  const params = searchParams.get("params")
  const apiKey = searchParams.get("apiKey") || "123"

  if (!endpoint) {
    return NextResponse.json({ error: "Missing endpoint" }, { status: 400 })
  }

  const cacheKey = `${endpoint}:${params || ""}:${apiKey}`

  try {
    const supabase = await getSupabaseServerClient()

    const cachedData = await getCachedData(supabase, cacheKey)
    if (cachedData) {
      await logRequest(supabase, endpoint, true, 200, true)
      return NextResponse.json(cachedData)
    }

    console.log(`[v0] Cache MISS for ${cacheKey}, fetching from API`)

    const baseUrl =
      endpoint === "lookuptv.php" ? `https://www.thesportsdb.com/api/v1/json/${apiKey}` : SPORTSDB_API_BASE

    const url = `${baseUrl}/${endpoint}?${params || ""}`
    console.log(`[v0] Fetching from: ${url}`)

    const response = await fetchWithRetry(url)

    if (!response) {
      console.log(`[v0] No response for ${endpoint}`)
      await logRequest(supabase, endpoint, false, 404, false)
      return NextResponse.json({ data: null }, { status: 200 })
    }

    const data = await response.json()

    console.log(`[v0] API Response for ${endpoint}:`, Object.keys(data))

    await Promise.all([setCachedData(supabase, cacheKey, data), logRequest(supabase, endpoint, true, 200, false)])

    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] API error:", error)
    return NextResponse.json({ data: null }, { status: 200 })
  }
}
