import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router'
import {
  Menu,
  X,
  Home,
  Users,
  LayoutDashboard,
  FileText,
  Video,
  Settings,
  LogOut,
  ChevronDown,
  Shield,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ROUTES } from '@/lib/constants'
import { useAuth } from '@/shared/hooks/useAuth'
import Avatar from './Avatar'
import ThemeToggle from './ThemeToggle'
import NotificationBell from '@/features/notifications/NotificationBell'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'

const navLinks = [
  { to: ROUTES.home, label: 'Home', icon: Home },
  { to: ROUTES.community, label: 'Community', icon: Users },
]

function DashboardDropdown() {
  const { isAdmin } = useAuth()

  const items = [
    { to: ROUTES.dashboardPosts, label: 'My Posts', icon: FileText },
    { to: ROUTES.dashboardVideos, label: 'My Videos', icon: Video },
    ...(isAdmin ? [{ to: ROUTES.admin, label: 'Admin Panel', icon: Shield }] : []),
  ]

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          className={cn(
            'flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium',
            'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
            'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
          )}
        >
          <LayoutDashboard className="h-4 w-4" />
          Dashboard
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="start"
          sideOffset={8}
          className={cn(
            'z-50 min-w-[10rem] overflow-hidden rounded-md border border-border',
            'bg-popover p-1 text-popover-foreground shadow-md',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95'
          )}
        >
          {items.map(({ to, label, icon: Icon }) => (
            <DropdownMenu.Item key={to} asChild>
              <Link
                to={to}
                className={cn(
                  'flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm',
                  'cursor-pointer outline-none transition-colors',
                  'hover:bg-accent hover:text-accent-foreground',
                  'focus:bg-accent focus:text-accent-foreground'
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

function UserMenu() {
  const { user, logout, isLoggingOut } = useAuth()
  const navigate = useNavigate()

  if (!user) return null

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          aria-label="User menu"
          className={cn(
            'flex items-center gap-1.5 rounded-full outline-none',
            'ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            'transition-opacity hover:opacity-80'
          )}
        >
          <Avatar src={user.avatarUrl} name={user.displayName} size="sm" />
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className={cn(
            'z-50 min-w-[12rem] overflow-hidden rounded-md border border-border',
            'bg-popover p-1 text-popover-foreground shadow-md',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95'
          )}
        >
          {/* User info header */}
          <div className="px-2 py-1.5 border-b border-border mb-1">
            <p className="text-sm font-semibold truncate">{user.displayName}</p>
            <p className="text-xs text-muted-foreground truncate">@{user.username}</p>
          </div>

          <DropdownMenu.Item asChild>
            <Link
              to={ROUTES.profile(user.username)}
              className={cn(
                'flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm cursor-pointer',
                'outline-none hover:bg-accent hover:text-accent-foreground',
                'focus:bg-accent focus:text-accent-foreground transition-colors'
              )}
            >
              <Avatar src={user.avatarUrl} name={user.displayName} size="sm" />
              Profile
            </Link>
          </DropdownMenu.Item>

          <DropdownMenu.Item asChild>
            <Link
              to={ROUTES.settings}
              className={cn(
                'flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm cursor-pointer',
                'outline-none hover:bg-accent hover:text-accent-foreground',
                'focus:bg-accent focus:text-accent-foreground transition-colors'
              )}
            >
              <Settings className="h-4 w-4" />
              Settings
            </Link>
          </DropdownMenu.Item>

          <DropdownMenu.Separator className="my-1 h-px bg-border" />

          <DropdownMenu.Item
            onSelect={() => logout()}
            disabled={isLoggingOut}
            className={cn(
              'flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm cursor-pointer',
              'outline-none hover:bg-destructive hover:text-destructive-foreground',
              'focus:bg-destructive focus:text-destructive-foreground transition-colors',
              'text-destructive'
            )}
          >
            <LogOut className="h-4 w-4" />
            {isLoggingOut ? 'Signing out…' : 'Sign out'}
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

export default function Navbar() {
  const location = useLocation()
  const { user, isAuthenticated } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const mobileMenuRef = useRef<HTMLDivElement>(null)

  // Close mobile menu on navigation
  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target as Node)) {
        setMobileOpen(false)
      }
    }
    if (mobileOpen) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [mobileOpen])

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link
          to={ROUTES.home}
          className="flex items-center gap-2 font-bold text-lg text-foreground hover:opacity-80 transition-opacity"
        >
          <span className="bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent">
            An Vo
          </span>
          <span className="hidden sm:inline text-xs font-normal text-muted-foreground border-l border-border pl-2">
            Portfolio
          </span>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className={cn(
                'flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                location.pathname === to
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
          {isAuthenticated && <DashboardDropdown />}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-1.5">
          <ThemeToggle />

          {isAuthenticated && user ? (
            <>
              <NotificationBell />
              <UserMenu />
            </>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <Link
                to={ROUTES.login}
                className={cn(
                  'rounded-md px-3 py-1.5 text-sm font-medium',
                  'text-muted-foreground hover:text-foreground transition-colors'
                )}
              >
                Sign in
              </Link>
              <Link
                to={ROUTES.register}
                className={cn(
                  'rounded-md bg-primary px-3 py-1.5 text-sm font-medium',
                  'text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm'
                )}
              >
                Get started
              </Link>
            </div>
          )}

          {/* Hamburger */}
          <button
            className="md:hidden ml-1 inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle mobile menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div
          ref={mobileMenuRef}
          className="md:hidden border-t border-border bg-background px-4 py-3 flex flex-col gap-1"
        >
          {navLinks.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className={cn(
                'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                location.pathname === to
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}

          {isAuthenticated ? (
            <>
              <Link
                to={ROUTES.dashboardPosts}
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                <FileText className="h-4 w-4" />
                My Posts
              </Link>
              <Link
                to={ROUTES.dashboardVideos}
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                <Video className="h-4 w-4" />
                My Videos
              </Link>
              <Link
                to={ROUTES.settings}
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                <Settings className="h-4 w-4" />
                Settings
              </Link>
            </>
          ) : (
            <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-border">
              <Link
                to={ROUTES.login}
                className="rounded-md border border-border px-4 py-2 text-sm font-medium text-center hover:bg-accent transition-colors"
              >
                Sign in
              </Link>
              <Link
                to={ROUTES.register}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-center text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Get started
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  )
}
