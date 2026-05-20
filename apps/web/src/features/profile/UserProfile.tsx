import { useState } from 'react'
import { useQuery, useInfiniteQuery } from '@tanstack/react-query'
import { Link } from 'react-router'
import * as Tabs from '@radix-ui/react-tabs'
import { FileText, Video as VideoIcon, Calendar, Globe, MapPin } from 'lucide-react'
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

  const { data: profile, isLoading, error } = useQuery({
    queryKey: QUERY_KEYS.user(username),
    queryFn: () => usersApi.getUser(username),
  })

  const isOwner = currentUser?.username === username

  const { data: followStatus } = useQuery({
    queryKey: [...QUERY_KEYS.user(profile?.id ?? ''), 'follow-status'],
    queryFn: () => usersApi.getFollowStatus(profile!.id),
    enabled: !!profile?.id && !isOwner && !!currentUser,
  })

  const postsQuery = useInfiniteQuery({
    queryKey: QUERY_KEYS.userPosts(username),
    queryFn: ({ pageParam = 1 }) =>
      usersApi.getUserPosts(profile!.id, { page: pageParam as number }),
    getNextPageParam: (last) => (last.hasNext ? last.page + 1 : undefined),
    initialPageParam: 1,
    enabled: !!profile?.id && activeTab === 'posts',
  })

  const videosQuery = useInfiniteQuery({
    queryKey: QUERY_KEYS.userVideos(username),
    queryFn: ({ pageParam = 1 }) =>
      usersApi.getUserVideos(profile!.id, { page: pageParam as number }),
    getNextPageParam: (last) => (last.hasNext ? last.page + 1 : undefined),
    initialPageParam: 1,
    enabled: !!profile?.id && activeTab === 'videos',
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

  const posts = postsQuery.data?.pages.flatMap((p) => p.items) ?? []
  const videos = videosQuery.data?.pages.flatMap((p) => p.items) ?? []

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Profile header card */}
      <div className="mb-8 rounded-2xl border border-border bg-card overflow-hidden">
        {/* Cover image */}
        <div className="relative h-40 sm:h-52">
          {(profile as { coverUrl?: string | null }).coverUrl ? (
            <img
              src={(profile as { coverUrl?: string | null }).coverUrl!}
              alt="Cover"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-primary/30 via-blue-500/20 to-purple-500/20" />
          )}
        </div>

        <div className="px-5 pb-6">
          {/* Avatar + actions row */}
          <div className="flex items-end justify-between -mt-12 mb-4">
            <div className="ring-4 ring-card rounded-full">
              <Avatar src={profile.avatarUrl} name={profile.displayName ?? profile.username} size="xl" />
            </div>
            <div className="flex items-center gap-2 pb-1">
              {isOwner ? (
                <Link
                  to="/settings"
                  className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium hover:bg-accent transition-colors"
                >
                  Edit profile
                </Link>
              ) : (
                <FollowButton
                  userId={profile.id}
                  isFollowing={followStatus?.isFollowing ?? false}
                />
              )}
            </div>
          </div>

          {/* Name, username */}
          <div className="mb-2">
            <h1 className="text-xl font-bold leading-tight">
              {profile.displayName ?? profile.username}
            </h1>
            <p className="text-sm text-muted-foreground">@{profile.username}</p>
          </div>

          {/* Bio */}
          {profile.bio && (
            <p className="text-sm text-muted-foreground mb-3 leading-relaxed max-w-lg">
              {profile.bio}
            </p>
          )}

          {/* Meta row: location, website, joined */}
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground mb-4">
            {(profile as { location?: string | null }).location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                {(profile as { location?: string | null }).location}
              </span>
            )}
            {(profile as { websiteUrl?: string | null }).websiteUrl && (
              <a
                href={(profile as { websiteUrl?: string | null }).websiteUrl!}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-primary hover:underline"
              >
                <Globe className="h-3.5 w-3.5 shrink-0" />
                {(profile as { websiteUrl?: string | null }).websiteUrl!.replace(/^https?:\/\//, '')}
              </a>
            )}
            {profile.createdAt && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 shrink-0" />
                Joined {formatDate(profile.createdAt, 'MMMM yyyy')}
              </span>
            )}
          </div>

          {/* Stats */}
          <div className="flex gap-5 text-sm">
            <div>
              <span className="font-bold">{formatNumber(profile.postCount ?? 0)}</span>
              <span className="ml-1 text-muted-foreground">Posts</span>
            </div>
            <div>
              <span className="font-bold">{formatNumber(profile.followerCount ?? 0)}</span>
              <span className="ml-1 text-muted-foreground">Followers</span>
            </div>
            <div>
              <span className="font-bold">{formatNumber(profile.followingCount ?? 0)}</span>
              <span className="ml-1 text-muted-foreground">Following</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs.Root value={activeTab} onValueChange={(v) => setActiveTab(v as ProfileTab)}>
        <Tabs.List className="flex gap-1 rounded-xl bg-muted p-1 mb-6">
          {(
            [
              { value: 'posts' as const, label: 'Posts', icon: FileText },
              { value: 'videos' as const, label: 'Videos', icon: VideoIcon },
            ] as const
          ).map(({ value, label, icon: Icon }) => (
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
                {isOwner
                  ? "You haven't posted anything yet."
                  : `${profile.displayName ?? profile.username} hasn't posted yet.`}
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
                {isOwner
                  ? "You haven't uploaded any videos yet."
                  : `${profile.displayName ?? profile.username} hasn't uploaded any videos yet.`}
              </p>
            }
          />
        </Tabs.Content>
      </Tabs.Root>
    </div>
  )
}
