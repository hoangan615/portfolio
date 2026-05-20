import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { useInfiniteScroll } from '@/shared/hooks/useInfiniteScroll'
import LoadingSpinner from './LoadingSpinner'

interface InfiniteListProps<T> {
  items: T[]
  renderItem: (item: T, index: number) => ReactNode
  hasNextPage: boolean
  isFetchingNextPage: boolean
  fetchNextPage: () => void
  isLoading?: boolean
  isEmpty?: boolean
  emptyMessage?: ReactNode
  loadingMessage?: ReactNode
  className?: string
  itemClassName?: string
  grid?: boolean
  keyExtractor?: (item: T, index: number) => string
}

export default function InfiniteList<T>({
  items,
  renderItem,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  isLoading = false,
  isEmpty = false,
  emptyMessage,
  loadingMessage,
  className,
  itemClassName,
  grid = false,
  keyExtractor,
}: InfiniteListProps<T>) {
  const { sentinelRef } = useInfiniteScroll({
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  })

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
        <LoadingSpinner size="lg" />
        {loadingMessage && <p className="text-sm">{loadingMessage}</p>}
      </div>
    )
  }

  if (isEmpty || items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        {emptyMessage ?? <p className="text-sm">No items found.</p>}
      </div>
    )
  }

  return (
    <div>
      <div
        className={cn(
          grid
            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'
            : 'flex flex-col gap-4',
          className
        )}
      >
        {items.map((item, index) => (
          <div key={keyExtractor ? keyExtractor(item, index) : index} className={itemClassName}>
            {renderItem(item, index)}
          </div>
        ))}
      </div>

      {/* Sentinel for intersection observer */}
      <div ref={sentinelRef} className="py-2" />

      {isFetchingNextPage && (
        <div className="flex justify-center py-4">
          <LoadingSpinner size="md" />
        </div>
      )}

      {!hasNextPage && items.length > 0 && (
        <p className="py-8 text-center text-sm text-muted-foreground">
          You've reached the end
        </p>
      )}
    </div>
  )
}
