import {
  useEffect,
  useRef,
  useState,
  useCallback,
  type KeyboardEvent,
} from 'react'
import Hls from 'hls.js'
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  PictureInPicture2,
  Settings,
  SkipForward,
  SkipBack,
} from 'lucide-react'
import { cn, formatDuration } from '@/lib/utils'

interface VideoPlayerProps {
  src: string
  poster?: string | null
  title?: string
  autoPlay?: boolean
  className?: string
}

interface QualityLevel {
  height: number
  bitrate: number
  index: number
}

export default function VideoPlayer({
  src,
  poster,
  title,
  autoPlay = false,
  className,
}: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<Hls | null>(null)
  const controlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [initialized, setInitialized] = useState(autoPlay)
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [muted, setMuted] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [levels, setLevels] = useState<QualityLevel[]>([])
  const [currentLevel, setCurrentLevel] = useState(-1)
  const [showQuality, setShowQuality] = useState(false)
  const [buffered, setBuffered] = useState(0)

  // Initialize HLS player
  const initPlayer = useCallback(() => {
    const video = videoRef.current
    if (!video || !src) return

    setInitialized(true)

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
      })
      hls.loadSource(src)
      hls.attachMedia(video)

      hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
        const qs: QualityLevel[] = data.levels.map((l, i) => ({
          height: l.height,
          bitrate: l.bitrate,
          index: i,
        }))
        setLevels(qs)
        if (autoPlay) video.play().catch(() => {})
      })

      hls.on(Hls.Events.LEVEL_SWITCHED, (_, data) => {
        setCurrentLevel(data.level)
      })

      hlsRef.current = hls
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Safari native HLS
      video.src = src
      if (autoPlay) video.play().catch(() => {})
    }
  }, [src, autoPlay])

  useEffect(() => {
    if (initialized) initPlayer()
    return () => {
      hlsRef.current?.destroy()
    }
  }, [initialized, initPlayer])

  // Sync fullscreen state
  useEffect(() => {
    const handleFsChange = () => {
      setFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFsChange)
    return () => document.removeEventListener('fullscreenchange', handleFsChange)
  }, [])

  // Auto-hide controls
  const resetControlsTimer = useCallback(() => {
    setShowControls(true)
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current)
    controlsTimerRef.current = setTimeout(() => {
      if (playing) setShowControls(false)
    }, 3000)
  }, [playing])

  const togglePlay = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    if (video.paused) {
      video.play()
    } else {
      video.pause()
    }
  }, [])

  const seek = useCallback((delta: number) => {
    const video = videoRef.current
    if (!video) return
    video.currentTime = Math.max(0, Math.min(video.duration, video.currentTime + delta))
  }, [])

  const toggleMute = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    video.muted = !video.muted
    setMuted(video.muted)
  }, [])

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current
    if (!video) return
    const v = parseFloat(e.target.value)
    video.volume = v
    setVolume(v)
    setMuted(v === 0)
    video.muted = v === 0
  }, [])

  const toggleFullscreen = useCallback(async () => {
    const container = containerRef.current
    if (!container) return
    if (!document.fullscreenElement) {
      await container.requestFullscreen()
    } else {
      await document.exitFullscreen()
    }
  }, [])

  const togglePiP = useCallback(async () => {
    const video = videoRef.current
    if (!video) return
    if (document.pictureInPictureElement) {
      await document.exitPictureInPicture()
    } else {
      await video.requestPictureInPicture()
    }
  }, [])

  const handleQualitySelect = useCallback((index: number) => {
    if (hlsRef.current) {
      hlsRef.current.currentLevel = index
    }
    setCurrentLevel(index)
    setShowQuality(false)
  }, [])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      switch (e.key) {
        case ' ':
        case 'k':
          e.preventDefault()
          togglePlay()
          break
        case 'ArrowLeft':
          e.preventDefault()
          seek(-5)
          break
        case 'ArrowRight':
          e.preventDefault()
          seek(5)
          break
        case 'f':
        case 'F':
          e.preventDefault()
          toggleFullscreen()
          break
        case 'm':
        case 'M':
          e.preventDefault()
          toggleMute()
          break
      }
    },
    [togglePlay, seek, toggleFullscreen, toggleMute]
  )

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  const qualityLabel = (level: number) => {
    if (level === -1) return 'Auto'
    const ql = levels[level]
    return ql ? `${ql.height}p` : 'Auto'
  }

  if (!initialized) {
    return (
      <div
        className={cn(
          'relative overflow-hidden rounded-xl bg-black cursor-pointer group',
          className
        )}
        onClick={initPlayer}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') initPlayer()
        }}
      >
        {poster && (
          <img src={poster} alt={title ?? 'Video'} className="w-full aspect-video object-cover" />
        )}
        {!poster && <div className="w-full aspect-video bg-black" />}
        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 shadow-xl transition-transform group-hover:scale-110">
            <Play className="h-7 w-7 fill-black text-black ml-1" />
          </div>
        </div>
        {title && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-4 pb-4 pt-8">
            <p className="text-white text-sm font-medium line-clamp-1">{title}</p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative overflow-hidden rounded-xl bg-black focus:outline-none',
        className
      )}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onMouseMove={resetControlsTimer}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => {
        if (playing) setShowControls(false)
      }}
    >
      {/* Video */}
      <video
        ref={videoRef}
        className="w-full aspect-video"
        poster={poster ?? undefined}
        playsInline
        onClick={togglePlay}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onTimeUpdate={() => {
          const video = videoRef.current
          if (!video) return
          setCurrentTime(video.currentTime)
          const buf = video.buffered
          if (buf.length > 0 && video.duration > 0) {
            setBuffered((buf.end(buf.length - 1) / video.duration) * 100)
          }
        }}
        onDurationChange={() => {
          const video = videoRef.current
          if (video) setDuration(video.duration)
        }}
        onVolumeChange={() => {
          const video = videoRef.current
          if (video) {
            setVolume(video.volume)
            setMuted(video.muted)
          }
        }}
      />

      {/* Controls overlay */}
      <div
        className={cn(
          'absolute inset-0 flex flex-col justify-end',
          'bg-gradient-to-t from-black/70 via-transparent to-transparent',
          'transition-opacity duration-300',
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
      >
        {/* Progress bar */}
        <div className="px-4 pb-1 group/progress">
          <div
            className="relative h-1 w-full cursor-pointer rounded-full bg-white/30 group-hover/progress:h-2 transition-all"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect()
              const ratio = (e.clientX - rect.left) / rect.width
              const video = videoRef.current
              if (video) video.currentTime = ratio * duration
            }}
          >
            {/* Buffered */}
            <div
              className="absolute h-full rounded-full bg-white/40"
              style={{ width: `${buffered}%` }}
            />
            {/* Played */}
            <div
              className="absolute h-full rounded-full bg-primary"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex items-center justify-between pt-0.5 text-xs text-white/80">
            <span>{formatDuration(currentTime)}</span>
            <span>{formatDuration(duration)}</span>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-1 px-4 pb-3">
          <button
            onClick={() => seek(-5)}
            className="p-1.5 rounded text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Rewind 5s"
          >
            <SkipBack className="h-4 w-4" />
          </button>

          <button
            onClick={togglePlay}
            className="p-1.5 rounded text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            aria-label={playing ? 'Pause' : 'Play'}
          >
            {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 fill-white" />}
          </button>

          <button
            onClick={() => seek(5)}
            className="p-1.5 rounded text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Forward 5s"
          >
            <SkipForward className="h-4 w-4" />
          </button>

          {/* Volume */}
          <div className="flex items-center gap-1">
            <button
              onClick={toggleMute}
              className="p-1.5 rounded text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              aria-label={muted ? 'Unmute' : 'Mute'}
            >
              {muted || volume === 0 ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={muted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-20 accent-primary cursor-pointer"
              aria-label="Volume"
            />
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Quality */}
          {levels.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setShowQuality((v) => !v)}
                className="flex items-center gap-1 rounded p-1.5 text-xs text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Quality"
              >
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">{qualityLabel(currentLevel)}</span>
              </button>
              {showQuality && (
                <div className="absolute bottom-full right-0 mb-2 overflow-hidden rounded-md bg-black/90 text-white text-xs shadow-xl min-w-[80px]">
                  <button
                    onClick={() => handleQualitySelect(-1)}
                    className={cn(
                      'block w-full px-3 py-1.5 text-left hover:bg-white/10',
                      currentLevel === -1 && 'text-primary'
                    )}
                  >
                    Auto
                  </button>
                  {[...levels].reverse().map((l) => (
                    <button
                      key={l.index}
                      onClick={() => handleQualitySelect(l.index)}
                      className={cn(
                        'block w-full px-3 py-1.5 text-left hover:bg-white/10',
                        currentLevel === l.index && 'text-primary'
                      )}
                    >
                      {l.height}p
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* PiP */}
          {'pictureInPictureEnabled' in document && (
            <button
              onClick={togglePiP}
              className="p-1.5 rounded text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Picture in Picture"
            >
              <PictureInPicture2 className="h-4 w-4" />
            </button>
          )}

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            aria-label={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          >
            {fullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  )
}
