import { useState } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import * as Tabs from '@radix-ui/react-tabs'
import { Globe, Users, TrendingUp, Compass } from 'lucide-react'
import { cn } from '@/lib/utils'
import { feedApi, type FeedItem } from '@/shared/api/feed'
import { useAuthStore } from '@/shared/stores/authStore'
import { QUERY_KEYS } from '@/lib/constants'
import InfiniteList from '@/shared/components/InfiniteList'
import FeedCard from './FeedCard'
import type { PagedResponse } from '@/shared/api/posts'

type FeedTab = 'global' | 'following' | 'trending' | 'explore'

const TABS: { value: FeedTab; label: string; icon: typeof Globe; requiresAuth?: boolean }[] = [
  { value: 'global', label: 'Global', icon: Globe },
  { value: 'following', label: 'Following', icon: Users, requiresAuth: true },
  { value: 'trending', label: 'Trending', icon: TrendingUp },
  { value: 'explore', label: 'Explore', icon: Compass },
]

function InfiniteFeed({
  queryKey,
  queryFn,
}: {
  queryKey: readonly unknown[]
  queryFn: (page: number) => Promise<PagedResponse<FeedItem>>
}) {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam = 1 }) => queryFn(pageParam as number),
    getNextPageParam: (last) => (last.hasNext ? last.page + 1 : undefined),
    initialPageParam: 1,
  })

  const items = data?.pages.flatMap((p) => p.items) ?? []

  return (
    <InfiniteList
      items={items}
      renderItem={(item) => <FeedCard item={item} />}
      keyExtractor={(item: FeedItem) => item.id}
      hasNextPage={!!hasNextPage}
      isFetchingNextPage={isFetchingNextPage}
      fetchNextPage={fetchNextPage}
      isLoading={isLoading}
      emptyMessage={
        <div className="text-center py-12">
          <Globe className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-40" />
          <p className="text-sm font-medium">Nothing here yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Be the first to post something!
          </p>
        </div>
      }
    />
  )
}

export default function Feed() {
  const { isAuthenticated } = useAuthStore()
  const [activeTab, setActiveTab] = useState<FeedTab>('global')

  return (
    <div className="flex-1 py-6 px-4 max-w-2xl mx-auto w-full">
      <Tabs.Root
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as FeedTab)}
      >
        <Tabs.List className="flex gap-1 rounded-xl bg-muted p-1 mb-6">
          {TABS.filter((t) => !t.requiresAuth || isAuthenticated).map(({ value, label, icon: Icon }) => (
            <Tabs.Trigger
              key={value}
              value={value}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium transition-colors',
                'text-muted-foreground hover:text-foreground',
                'data-[state=active]:bg-background data-[state=active]:text-foreground',
                'data-[state=active]:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{label}</span>
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        <Tabs.Content value="global" className="outline-none">
          <InfiniteFeed
            queryKey={QUERY_KEYS.feedInfinite('global')}
            queryFn={feedApi.getGlobalFeed}
          />
        </Tabs.Content>

        <Tabs.Content value="following" className="outline-none">
          <InfiniteFeed
            queryKey={QUERY_KEYS.feedInfinite('following')}
            queryFn={feedApi.getFollowingFeed}
          />
        </Tabs.Content>

        <Tabs.Content value="trending" className="outline-none">
          <InfiniteFeed
            queryKey={QUERY_KEYS.feedInfinite('trending')}
            queryFn={feedApi.getTrendingFeed}
          />
        </Tabs.Content>

        <Tabs.Content value="explore" className="outline-none">
          <InfiniteFeed
            queryKey={QUERY_KEYS.feedInfinite('explore')}
            queryFn={feedApi.getExploreFeed}
          />
        </Tabs.Content>
      </Tabs.Root>
    </div>
  )
}
