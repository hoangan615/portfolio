import { useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQuery } from '@tanstack/react-query'
import * as Tabs from '@radix-ui/react-tabs'
import { User, Lock, Bell, Trash2, Save, ImageIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { usersApi } from '@/shared/api/users'
import { authApi } from '@/shared/api/auth'
import apiClient from '@/shared/api/client'
import { useAuthStore } from '@/shared/stores/authStore'
import { toast } from '@/shared/stores/notificationStore'
import Avatar from '@/shared/components/Avatar'
import Button from '@/shared/components/Button'
import LoadingSpinner from '@/shared/components/LoadingSpinner'

type SettingsTab = 'profile' | 'password' | 'notifications' | 'account'

const TABS: { value: SettingsTab; label: string; icon: typeof User }[] = [
  { value: 'profile', label: 'Profile', icon: User },
  { value: 'password', label: 'Password', icon: Lock },
  { value: 'notifications', label: 'Notifications', icon: Bell },
  { value: 'account', label: 'Account', icon: Trash2 },
]

function CoverUploadButton({
  currentUrl,
  onUploaded,
}: {
  currentUrl: string | null | undefined
  onUploaded: (url: string) => void
}) {
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const { updateUser } = useAuthStore()

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const { data: updated } = await apiClient.post('/users/me/cover', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      updateUser(updated)
      onUploaded(updated.coverUrl ?? updated.cover_url ?? '')
      toast.success('Cover updated!')
    } catch {
      toast.error('Failed to upload cover image')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium">Cover Image</label>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />

      <div className="relative rounded-xl overflow-hidden aspect-[3/1] bg-gradient-to-br from-primary/30 via-blue-500/20 to-purple-500/20">
        {currentUrl && (
          <img src={currentUrl} alt="Cover" className="absolute inset-0 h-full w-full object-cover" />
        )}
        <div className="absolute inset-0 flex items-end justify-end p-3">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-1.5 rounded-md bg-black/60 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm hover:bg-black/75 transition-colors disabled:opacity-50"
          >
            {uploading ? <LoadingSpinner size="xs" /> : <ImageIcon className="h-3.5 w-3.5" />}
            {uploading ? 'Uploading…' : currentUrl ? 'Change cover' : 'Add cover'}
          </button>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">JPG, PNG, WebP. Recommended: 1500×500px.</p>
    </div>
  )
}

function ProfileSettings() {
  const { user, updateUser } = useAuthStore()
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [coverUrl, setCoverUrl] = useState<string | null>(user?.coverUrl ?? null)

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      displayName: user?.displayName ?? '',
      bio: user?.bio ?? '',
      websiteUrl: user?.websiteUrl ?? '',
      location: user?.location ?? '',
    },
  })

  const mutation = useMutation({
    mutationFn: (data: { displayName?: string; bio?: string; websiteUrl?: string; location?: string }) =>
      usersApi.updateProfile(data),
    onSuccess: (updated) => {
      updateUser(updated)
      toast.success('Profile updated!')
    },
    onError: () => toast.error('Failed to update profile'),
  })

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const { data: updated } = await apiClient.post('/users/me/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      updateUser(updated)
      toast.success('Avatar updated!')
    } catch {
      toast.error('Failed to upload avatar')
    } finally {
      setAvatarUploading(false)
      if (avatarInputRef.current) avatarInputRef.current.value = ''
    }
  }

  return (
    <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-5">
      {/* Cover image */}
      <CoverUploadButton currentUrl={coverUrl} onUploaded={setCoverUrl} />

      {/* Avatar */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <Avatar src={user?.avatarUrl} name={user?.displayName ?? ''} size="xl" />
          {avatarUploading && (
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
              <LoadingSpinner size="sm" />
            </div>
          )}
        </div>
        <div>
          <input ref={avatarInputRef} id="avatar-upload" type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          <button
            type="button"
            onClick={() => avatarInputRef.current?.click()}
            disabled={avatarUploading}
            className="rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-accent transition-colors disabled:opacity-50"
          >
            {avatarUploading ? 'Uploading…' : 'Change photo'}
          </button>
          <p className="mt-1 text-xs text-muted-foreground">JPG, PNG, WebP. Max 5 MB.</p>
        </div>
      </div>

      {/* Display Name */}
      <div className="space-y-1.5">
        <label className="block text-sm font-medium">Display Name</label>
        <input
          type="text"
          className={cn(
            'w-full rounded-md border border-border bg-background px-3 py-2 text-sm',
            'focus:outline-none focus:ring-2 focus:ring-ring transition-colors',
            errors.displayName && 'border-destructive'
          )}
          {...register('displayName', {
            required: 'Display name is required',
            minLength: { value: 2, message: 'Min 2 characters' },
          })}
        />
        {errors.displayName && (
          <p className="text-xs text-destructive">{errors.displayName.message}</p>
        )}
      </div>

      {/* Bio */}
      <div className="space-y-1.5">
        <label className="block text-sm font-medium">Bio</label>
        <textarea
          rows={3}
          placeholder="Tell people about yourself…"
          className="w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
          {...register('bio')}
        />
      </div>

      {/* Website & Location in 2 columns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="block text-sm font-medium">Website</label>
          <input
            type="url"
            placeholder="https://yoursite.com"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
            {...register('websiteUrl')}
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-sm font-medium">Location</label>
          <input
            type="text"
            placeholder="City, Country"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
            {...register('location')}
          />
        </div>
      </div>

      <Button type="submit" className="gap-2" loading={mutation.isPending}>
        <Save className="h-4 w-4" />
        Save Changes
      </Button>
    </form>
  )
}

function PasswordSettings() {
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<{
    currentPassword: string
    newPassword: string
    confirmPassword: string
  }>()
  const newPwd = watch('newPassword')

  const mutation = useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) =>
      authApi.updatePassword(data),
    onSuccess: () => {
      toast.success('Password updated!')
      reset()
    },
    onError: () => toast.error('Failed to update password', 'Check your current password.'),
  })

  return (
    <form
      onSubmit={handleSubmit(({ currentPassword, newPassword }) =>
        mutation.mutate({ currentPassword, newPassword })
      )}
      className="space-y-4 max-w-sm"
    >
      {(
        [
          { id: 'currentPassword', label: 'Current Password', rules: { required: 'Required' } },
          {
            id: 'newPassword',
            label: 'New Password',
            rules: { required: 'Required', minLength: { value: 8, message: 'Min 8 characters' } },
          },
          {
            id: 'confirmPassword',
            label: 'Confirm New Password',
            rules: {
              required: 'Required',
              validate: (v: string) => v === newPwd || 'Passwords do not match',
            },
          },
        ] as const
      ).map(({ id, label, rules }) => (
        <div key={id} className="space-y-1.5">
          <label className="block text-sm font-medium">{label}</label>
          <input
            type="password"
            className={cn(
              'w-full rounded-md border border-border bg-background px-3 py-2 text-sm',
              'focus:outline-none focus:ring-2 focus:ring-ring transition-colors',
              Boolean((errors as Record<string, unknown>)[id]) && 'border-destructive'
            )}
            {...register(id as 'currentPassword' | 'newPassword' | 'confirmPassword', rules)}
          />
          {(errors as Record<string, { message?: string }>)[id] && (
            <p className="text-xs text-destructive">
              {(errors as Record<string, { message?: string }>)[id]?.message}
            </p>
          )}
        </div>
      ))}

      <Button type="submit" className="gap-2" loading={mutation.isPending}>
        <Save className="h-4 w-4" />
        Update Password
      </Button>
    </form>
  )
}

interface NotificationPrefs {
  emailOnComment: boolean
  emailOnFollow: boolean
  emailOnReaction: boolean
  emailNewsletter: boolean
}

const NOTIFICATION_TOGGLES: { key: keyof NotificationPrefs; label: string; desc: string }[] = [
  { key: 'emailOnFollow', label: 'New follower emails', desc: 'Get notified when someone follows you' },
  {
    key: 'emailOnComment',
    label: 'Comment emails',
    desc: 'Get notified when someone comments on your posts or videos',
  },
  {
    key: 'emailOnReaction',
    label: 'Reaction emails',
    desc: 'Get notified when someone reacts to your content',
  },
  { key: 'emailNewsletter', label: 'Newsletter', desc: 'Receive platform newsletter and updates' },
]

function NotificationSettings() {
  const { data: serverSettings, isLoading } = useQuery({
    queryKey: ['me', 'settings'],
    queryFn: async () => {
      const { data } = await apiClient.get<NotificationPrefs>('/users/me/settings')
      return data
    },
  })

  const { register, handleSubmit, watch, setValue, reset } = useForm<NotificationPrefs>({
    defaultValues: {
      emailOnComment: true,
      emailOnFollow: true,
      emailOnReaction: false,
      emailNewsletter: true,
    },
  })

  // Populate from server once loaded
  const [synced, setSynced] = useState(false)
  if (serverSettings && !synced) {
    reset(serverSettings)
    setSynced(true)
  }

  const values = watch()

  const mutation = useMutation({
    mutationFn: (prefs: NotificationPrefs) =>
      apiClient.patch('/users/me/settings', {
        email_on_comment: prefs.emailOnComment,
        email_on_follow: prefs.emailOnFollow,
        email_on_reaction: prefs.emailOnReaction,
        email_newsletter: prefs.emailNewsletter,
      }),
    onSuccess: () => toast.success('Notification preferences saved!'),
    onError: () => toast.error('Failed to save preferences'),
  })

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
      {NOTIFICATION_TOGGLES.map(({ key, label, desc }) => (
        <div
          key={key}
          className="flex items-center justify-between gap-4 py-3 border-b border-border last:border-0"
        >
          <div>
            <p className="text-sm font-medium">{label}</p>
            <p className="text-xs text-muted-foreground">{desc}</p>
          </div>
          <input type="checkbox" className="sr-only" {...register(key)} />
          <button
            type="button"
            role="switch"
            aria-checked={values[key]}
            onClick={() => setValue(key, !values[key])}
            className={cn(
              'relative h-6 w-11 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              values[key] ? 'bg-primary' : 'bg-muted'
            )}
          >
            <span
              className={cn(
                'absolute top-1 left-1 h-4 w-4 rounded-full bg-white shadow transition-transform',
                values[key] && 'translate-x-5'
              )}
            />
          </button>
        </div>
      ))}

      <Button type="submit" className="gap-2" loading={mutation.isPending}>
        <Save className="h-4 w-4" />
        Save Preferences
      </Button>
    </form>
  )
}

function AccountSettings() {
  const { logout } = useAuthStore()

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="text-sm font-semibold mb-1">Sign Out</h3>
        <p className="text-sm text-muted-foreground mb-4">Sign out of your account on this device.</p>
        <Button variant="outline" size="sm" onClick={() => logout()}>
          Sign Out
        </Button>
      </div>

      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-5">
        <h3 className="text-sm font-semibold text-destructive mb-1">Danger Zone</h3>
        <p className="text-sm text-muted-foreground mb-4">
          These actions are irreversible. Please proceed with caution.
        </p>
        <Button
          variant="destructive"
          size="sm"
          className="gap-2"
          onClick={() => {
            if (
              window.confirm(
                'Are you sure you want to delete your account? This cannot be undone.'
              )
            ) {
              toast.error('Account deletion', 'This feature requires contacting support.')
            }
          }}
        >
          <Trash2 className="h-4 w-4" />
          Delete Account
        </Button>
      </div>
    </div>
  )
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile')

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your account preferences and settings.
        </p>
      </div>

      <Tabs.Root
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as SettingsTab)}
        className="flex flex-col sm:flex-row gap-6"
      >
        <Tabs.List className="flex sm:flex-col gap-1 sm:w-44 shrink-0">
          {TABS.map(({ value, label, icon: Icon }) => (
            <Tabs.Trigger
              key={value}
              value={value}
              className={cn(
                'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-left transition-colors w-full',
                'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                'data-[state=active]:bg-accent data-[state=active]:text-accent-foreground',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        <div className="flex-1 min-w-0">
          <Tabs.Content value="profile" className="outline-none">
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="text-base font-semibold mb-5">Profile Settings</h2>
              <ProfileSettings />
            </div>
          </Tabs.Content>

          <Tabs.Content value="password" className="outline-none">
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="text-base font-semibold mb-5">Change Password</h2>
              <PasswordSettings />
            </div>
          </Tabs.Content>

          <Tabs.Content value="notifications" className="outline-none">
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="text-base font-semibold mb-5">Notification Settings</h2>
              <NotificationSettings />
            </div>
          </Tabs.Content>

          <Tabs.Content value="account" className="outline-none">
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="text-base font-semibold mb-5">Account Settings</h2>
              <AccountSettings />
            </div>
          </Tabs.Content>
        </div>
      </Tabs.Root>
    </div>
  )
}
