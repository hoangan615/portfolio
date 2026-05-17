import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { UserPlus, UserMinus, UserCheck } from 'lucide-react'
import { usersApi } from '@/shared/api/users'
import { useAuthStore } from '@/shared/stores/authStore'
import { QUERY_KEYS } from '@/lib/constants'
import Button from '@/shared/components/Button'
import type { ButtonProps } from '@/shared/components/Button'

interface FollowButtonProps {
  userId: string
  username?: string
  isFollowing: boolean
  size?: ButtonProps['size']
  className?: string
}

export default function FollowButton({
  userId,
  username,
  isFollowing: initialFollowing,
  size = 'sm',
  className,
}: FollowButtonProps) {
  const { isAuthenticated } = useAuthStore()
  const queryClient = useQueryClient()
  const [following, setFollowing] = useState(initialFollowing)
  const [hovered, setHovered] = useState(false)

  const mutation = useMutation({
    mutationFn: () =>
      following
        ? usersApi.unfollowUser(userId)
        : usersApi.followUser(userId),
    onMutate: () => {
      setFollowing((prev) => !prev)
    },
    onError: () => {
      // Revert on error
      setFollowing((prev) => !prev)
    },
    onSuccess: () => {
      if (username) {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.user(username) })
      }
    },
  })

  if (!isAuthenticated) return null

  if (following) {
    return (
      <Button
        size={size}
        variant={hovered ? 'destructive' : 'outline'}
        className={className}
        loading={mutation.isPending}
        onClick={() => mutation.mutate()}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {hovered ? (
          <>
            <UserMinus className="h-3.5 w-3.5 mr-1" />
            Unfollow
          </>
        ) : (
          <>
            <UserCheck className="h-3.5 w-3.5 mr-1" />
            Following
          </>
        )}
      </Button>
    )
  }

  return (
    <Button
      size={size}
      className={className}
      loading={mutation.isPending}
      onClick={() => mutation.mutate()}
    >
      <UserPlus className="h-3.5 w-3.5 mr-1" />
      Follow
    </Button>
  )
}
