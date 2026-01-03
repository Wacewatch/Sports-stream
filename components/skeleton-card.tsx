"use client"

export function SkeletonCard() {
  return (
    <div className="flex-shrink-0 w-[300px] md:w-[320px] rounded-2xl overflow-hidden bg-card border border-border animate-pulse">
      <div className="aspect-video bg-muted relative">
        <div className="absolute top-3 left-3 w-16 h-6 bg-muted-foreground/20 rounded-lg" />
        <div className="absolute top-3 right-3 w-20 h-6 bg-muted-foreground/20 rounded-lg" />
        <div className="absolute inset-0 flex items-center justify-center gap-8 p-4">
          <div className="flex flex-col items-center gap-2">
            <div className="w-14 h-14 rounded-full bg-muted-foreground/20" />
            <div className="w-16 h-4 bg-muted-foreground/20 rounded" />
          </div>
          <div className="w-8 h-8 bg-muted-foreground/20 rounded" />
          <div className="flex flex-col items-center gap-2">
            <div className="w-14 h-14 rounded-full bg-muted-foreground/20" />
            <div className="w-16 h-4 bg-muted-foreground/20 rounded" />
          </div>
        </div>
      </div>
      <div className="p-4 space-y-3">
        <div className="h-5 bg-muted-foreground/20 rounded w-3/4" />
        <div className="flex justify-between">
          <div className="h-4 bg-muted-foreground/20 rounded w-24" />
          <div className="h-4 bg-muted-foreground/20 rounded w-12" />
        </div>
      </div>
    </div>
  )
}

export function SkeletonSportCard() {
  return (
    <div className="flex-shrink-0 w-[160px] md:w-[190px] rounded-2xl p-6 bg-card border border-border animate-pulse">
      <div className="flex flex-col items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-muted-foreground/20" />
        <div className="w-20 h-5 bg-muted-foreground/20 rounded" />
        <div className="w-16 h-4 bg-muted-foreground/20 rounded" />
      </div>
    </div>
  )
}
