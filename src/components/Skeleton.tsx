'use client'

export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
  )
}

export function StoreCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <Skeleton className="h-36 w-full rounded-none" />
      <div className="p-3 space-y-2">
        <div className="flex justify-between">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-14" />
        </div>
      </div>
    </div>
  )
}

export function MenuItemSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-orange-100/60 overflow-hidden">
      <div className="flex">
        <Skeleton className="w-24 h-24 shrink-0 rounded-none" />
        <div className="flex-1 p-3 space-y-2">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-16" />
          <div className="flex justify-between items-center">
            <Skeleton className="h-5 w-14" />
            <Skeleton className="h-7 w-7 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  )
}

export function StatsCardSkeleton() {
  return (
    <div className="bg-white rounded-xl p-4 border border-gray-100 space-y-2">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-8 w-20" />
    </div>
  )
}
