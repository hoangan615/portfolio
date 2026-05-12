import { useState } from 'react'
import { useQuery, useInfiniteQuery } from '@tanstack/react-query'
import { Link } from 'react-router'
import * as Tabs from '@radix-ui/react-tabs'
import {
  FileText,
  Video,
  Heart,
  Bookmark,
  MapPin,
  Globe,
  Calendar,
  Users,
} from 'lucide-react'
import { cn, formatDate, formatNumber } from '@/lib/utils'
import { usersApi } from '@/shared/api/users'
import { useAuthStore } from '@/shared/stores/authStore'
import { QUERY_KEYS } from '@/lib/constants'
import Avatar from '@/shared/components/Avatar'
import FollowButton from './FollowButton'
import PostCard from '@/shared/components/PostCard'
import VideoCard from '@/shared/components/VideoCard'
import InfiniteList from '@/shared/components/InfiniteList'
import LoadingSpinner from '@/shared/components/LoadingSpinner'
import type { Post } from '@/shared/api/posts'
import type { Video as VideoType } from '@/shared/api/videos'

type ProfileTab = 'posts' | 'videos'

interface UserProfileProps {
  username: string
}

export default function UserProfile({ username }: UserProfileProps) {
  const { user: currentUser } = useAuthStore()
  const [activeTab, setActiveTab] = useState<ProfileTab>('posts')

  const {
    data: profile,
    isLoading,
    error,
  } = useQuery({
    queryKey: QUERY_KEYS.user(username),
    queryFn: () => usersApi.getUser(username),
  })

  const isOwner = currentUser?.username === username

  // Posts infinite query
  const postsQuery = useInfiniteQuery({
    queryKey: QUERY_KEYS.userPosts(username),
    queryFn: ({ pageParam = 1 }) =>
      usersApi.getUserPosts(username, { page: pageParam as number }),
    getNextPageParam: (last, pages) => (last.meta.hasMore ? pages.length + 1 : undefined),
    initialPageParam: 1,
    enabled: activeTab === 'posts',
  })

  const videosQuery = useInfiniteQuery({
    queryKey: QUERY_KEYS.userVideos(username),
    queryFn: ({ pageParam = 1 }) =>
      usersApi.getUserVideos(username, { page: pageParam as number }),
    getNextPageParam: (last, pages) => (last.meta.hasMore ? pages.length + 1 : undefined),
    initialPageParam: 1,
    enabled: activeTab === 'videos',
  })

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner size="xl" />
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <p className="text-lg font-medium">User not found</p>
        <Link to="/" className="mt-2 text-sm text-primary hover:underline">
          Go home
        </Link>
      </div>
    )
  }

  const posts = postsQuery.data?.pages.flatMap((p) => p.data) ?? []
  const videos = videosQuery.data?.pages.flatMap((p) => p.data) ?? []

  const stats = [
    { label: 'Posts', value: formatNumber(profile.postsCount), icon: FileText },
    { label: 'Videos', value: formatNumber(profile.videosCount), icon: Video },
    { label: 'Followers', value: formatNumber(profile.followersCount), icon: Users },
    { label: 'Following', value: formatNumber(profile.followingCount), icon: Users },
  ]

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Profile header */}
      <div className="mb-8 rounded-xl border border-border bg-card overflow-hidden">
        {/* Cover */}
        <div className="h-32 bg-gradient-to-r from-primary/20 to-blue-500/20" />

        <div className="px-6 pb-6">
          {/* Avatar + actions */}
          <div className="flex items-end justify-between -mt-10 mb-4">
            <div className="ring-4 ring-card rounded-full">
              <Avatar src={profile.avatarUrl} name={profile.displayName} size="xl" />
            </div>

            <div className="flex items-center gap-2 mt-3">
              {isOwner ? (
                <Link
                  to="/settings"
                  className="rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-accent transition-colors"
                >
                  Edit profile
                </Link>
              ) : (
                <FollowButton
                  username={profile.username}
                  isFollowing={profile.isFollowing ?? false}
                />
              )}
            </div>
          </div>

          {/* Name & username */}
          <div className="mb-3">
            <h1 className="text-xl font-bold">{profile.displayName}</h1>
            <p className="text-sm text-muted-foreground">@{profile.username}</p>
          </div>

          {/* Bio */}
          {profile.bio && (
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{profile.bio}</p>
          )}

          {/* Meta */}
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mb-4">
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              Joined {formatDate(profile.createdAt, 'MMMM yyyy')}
            </span>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {stats.map(({ label, value, icon: Icon }) => (
              <div
                key={label}
                className="rounded-lg bg-muted/50 px-3 py-2 text-center"
              >
                <p className="text-base font-bold">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs.Root
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as ProfileTab)}
      >
        <Tabs.List className="flex gap-1 rounded-xl bg-muted p-1 mb-6">
          {([
            { value: 'posts' as const, label: 'Posts', icon: FileText },
            { value: 'videos' as const, label: 'Videos', icon: Video },
          ] as const).map(({ value, label, icon: Icon }) => (
            <Tabs.Trigger
              key={value}
              value={value}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium transition-colors',
                'text-muted-foreground hover:text-foreground',
                'data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        <Tabs.Content value="posts" className="outline-none">
          <InfiniteList
            items={posts}
            renderItem={(post) => <PostCard post={post as Post} />}
            hasNextPage={!!postsQuery.hasNextPage}
            isFetchingNextPage={postsQuery.isFetchingNextPage}
            fetchNextPage={postsQuery.fetchNextPage}
            isLoading={postsQuery.isLoading}
            emptyMessage={
              <p className="text-sm text-muted-foreground">
                {isOwner ? "You haven't posted anything yet." : `${profile.displayName} hasn't posted yet.`}
              </p>
            }
          />
        </Tabs.Content>

        <Tabs.Content value="videos" className="outline-none">
          <InfiniteList
            items={videos}
            renderItem={(video) => <VideoCard video={video as VideoType} />}
            hasNextPage={!!videosQuery.hasNextPage}
            isFetchingNextPage={videosQuery.isFetchingNextPage}
            fetchNextPage={videosQuery.fetchNextPage}
            isLoading={videosQuery.isLoading}
            grid
            emptyMessage={
              <p className="text-sm text-muted-foreground">
                {isOwner ? "You haven't uploaded any videos yet." : `${profile.displayName} hasn't uploaded videos yet.`}
              </p>
            }
          />
        </Tabs.Content>
      </Tabs.Root>
    </div>
  )
}
