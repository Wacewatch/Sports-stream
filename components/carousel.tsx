"use client"

import { useRef, useEffect, type ReactNode } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useSwipe } from "@/hooks/use-swipe"
import { cn } from "@/lib/utils"

interface CarouselProps {
  children: ReactNode
  className?: string
  showButtons?: boolean
}

export function Carousel({ children, className, showButtons = true }: CarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null)

  const scroll = (direction: number) => {
    if (!trackRef.current) return
    const cardWidth = 320
    const gap = 24
    const scrollAmount = (cardWidth + gap) * 2

    const currentScroll = trackRef.current.scrollLeft
    const targetScroll = currentScroll + direction * scrollAmount

    trackRef.current.scrollTo({
      left: targetScroll,
      behavior: "smooth",
    })
  }

  const swipeHandlers = useSwipe({
    onSwipeLeft: () => scroll(1),
    onSwipeRight: () => scroll(-1),
  })

  useEffect(() => {
    const track = trackRef.current
    if (!track) return

    let isDown = false
    let startX = 0
    let scrollLeft = 0

    const handleMouseDown = (e: MouseEvent) => {
      isDown = true
      track.style.cursor = "grabbing"
      track.style.userSelect = "none"
      startX = e.pageX - track.offsetLeft
      scrollLeft = track.scrollLeft
    }

    const handleMouseLeave = () => {
      isDown = false
      track.style.cursor = "grab"
      track.style.userSelect = ""
    }

    const handleMouseUp = () => {
      isDown = false
      track.style.cursor = "grab"
      track.style.userSelect = ""
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDown) return
      e.preventDefault()
      const x = e.pageX - track.offsetLeft
      const walk = (x - startX) * 2
      track.scrollLeft = scrollLeft - walk
    }

    const handleTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].pageX - track.offsetLeft
      scrollLeft = track.scrollLeft
    }

    const handleTouchMove = (e: TouchEvent) => {
      const x = e.touches[0].pageX - track.offsetLeft
      const walk = (x - startX) * 2
      track.scrollLeft = scrollLeft - walk
    }

    track.addEventListener("mousedown", handleMouseDown)
    track.addEventListener("mouseleave", handleMouseLeave)
    track.addEventListener("mouseup", handleMouseUp)
    track.addEventListener("mousemove", handleMouseMove)
    track.addEventListener("touchstart", handleTouchStart, { passive: true })
    track.addEventListener("touchmove", handleTouchMove, { passive: true })

    return () => {
      track.removeEventListener("mousedown", handleMouseDown)
      track.removeEventListener("mouseleave", handleMouseLeave)
      track.removeEventListener("mouseup", handleMouseUp)
      track.removeEventListener("mousemove", handleMouseMove)
      track.removeEventListener("touchstart", handleTouchStart)
      track.removeEventListener("touchmove", handleTouchMove)
    }
  }, [])

  return (
    <div className={cn("relative group", className)}>
      {showButtons && (
        <>
          <button
            onClick={() => scroll(-1)}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-background/90 border border-border flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-primary hover:border-primary hover:text-primary-foreground hover:scale-110 shadow-lg hidden md:flex"
            aria-label="Previous"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={() => scroll(1)}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-background/90 border border-border flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-primary hover:border-primary hover:text-primary-foreground hover:scale-110 shadow-lg hidden md:flex"
            aria-label="Next"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      <div
        ref={trackRef}
        {...swipeHandlers}
        className="flex gap-4 sm:gap-6 overflow-x-auto scroll-smooth pb-4 px-1 cursor-grab active:cursor-grabbing"
        style={{
          scrollbarWidth: "thin",
          scrollbarColor: "var(--primary) var(--card)",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {children}
      </div>
    </div>
  )
}
