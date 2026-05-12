import { describe, it, expect } from 'vitest'
import { QUERY_KEYS, ROUTES, PAGINATION, UPLOAD, ROLES } from '@/lib/constants'

describe('QUERY_KEYS', () => {
  it('me key is stable', () => {
    expect(QUERY_KEYS.me).toEqual(['me'])
  })

  it('post key includes slug', () => {
    expect(QUERY_KEYS.post('my-slug')).toEqual(['posts', 'my-slug'])
  })

  it('video key includes id', () => {
    expect(QUERY_KEYS.video('vid-1')).toEqual(['videos', 'vid-1'])
  })

  it('user key includes username', () => {
    expect(QUERY_KEYS.user('alice')).toEqual(['users', 'alice'])
  })

  it('feedInfinite with filter', () => {
    expect(QUERY_KEYS.feedInfinite('trending')).toEqual(['feed', 'infinite', 'trending'])
  })

  it('feedInfinite without filter', () => {
    expect(QUERY_KEYS.feedInfinite()).toEqual(['feed', 'infinite', undefined])
  })
})

describe('ROUTES', () => {
  it('static routes have correct paths', () => {
    expect(ROUTES.home).toBe('/')
    expect(ROUTES.community).toBe('/community')
    expect(ROUTES.login).toBe('/login')
    expect(ROUTES.register).toBe('/register')
    expect(ROUTES.settings).toBe('/settings')
    expect(ROUTES.admin).toBe('/admin')
  })

  it('dynamic routes include the id/slug', () => {
    expect(ROUTES.watch('vid-123')).toBe('/watch/vid-123')
    expect(ROUTES.post('my-post-slug')).toBe('/post/my-post-slug')
    expect(ROUTES.profile('alice')).toBe('/u/alice')
  })
})

describe('PAGINATION', () => {
  it('has sensible defaults', () => {
    expect(PAGINATION.defaultLimit).toBeGreaterThan(0)
    expect(PAGINATION.videoLimit).toBeGreaterThan(0)
    expect(PAGINATION.commentLimit).toBeGreaterThan(0)
  })
})

describe('UPLOAD', () => {
  it('maxFileSize is at least 1 MB', () => {
    expect(UPLOAD.maxFileSize).toBeGreaterThanOrEqual(1024 * 1024)
  })

  it('allows common video types', () => {
    expect(UPLOAD.allowedVideoTypes).toContain('video/mp4')
  })

  it('allows common image types', () => {
    expect(UPLOAD.allowedImageTypes).toContain('image/jpeg')
    expect(UPLOAD.allowedImageTypes).toContain('image/png')
  })
})

describe('ROLES', () => {
  it('defines user, moderator, admin', () => {
    expect(ROLES.user).toBe('user')
    expect(ROLES.moderator).toBe('moderator')
    expect(ROLES.admin).toBe('admin')
  })
})
