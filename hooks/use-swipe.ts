"use client"

import type React from "react"

import { useRef, useCallback } from "react"

interface SwipeHandlers {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
}

export function useSwipe(handlers: SwipeHandlers) {
  const touchStart = useRef<number | null>(null)
  const touchEnd = useRef<number | null>(null)

  const minSwipeDistance = 50

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchEnd.current = null
    touchStart.current = e.targetTouches[0].clientX
  }, [])

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    touchEnd.current = e.targetTouches[0].clientX
  }, [])

  const onTouchEnd = useCallback(() => {
    if (!touchStart.current || !touchEnd.current) return

    const distance = touchStart.current - touchEnd.current
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance

    if (isLeftSwipe && handlers.onSwipeLeft) {
      handlers.onSwipeLeft()
    }
    if (isRightSwipe && handlers.onSwipeRight) {
      handlers.onSwipeRight()
    }
  }, [handlers])

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
  }
}
