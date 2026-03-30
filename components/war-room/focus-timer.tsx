'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Settings, 
  Volume2, 
  VolumeX,
  ChevronUp,
  ChevronDown,
  ArrowLeft
} from 'lucide-react'

interface FocusTimerProps {
  onSessionComplete?: (minutes: number) => void
  className?: string
}

type TimerMode = 'focus' | 'shortBreak' | 'longBreak'

const modeConfig = {
  focus: { label: 'FOCUS', color: 'text-neon-green', duration: 25 },
  shortBreak: { label: 'SHORT BREAK', color: 'text-neon-cyan', duration: 5 },
  longBreak: { label: 'LONG BREAK', color: 'text-neon-amber', duration: 15 },
}

export function FocusTimer({ onSessionComplete, className }: FocusTimerProps) {
  const [mode, setMode] = useState<TimerMode>('focus')
  const [duration, setDuration] = useState(modeConfig.focus.duration * 60)
  const [timeLeft, setTimeLeft] = useState(duration)
  const [isRunning, setIsRunning] = useState(false)
  const [sessionsCompleted, setSessionsCompleted] = useState(0)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [showSettings, setShowSettings] = useState(false)
  const [customDurations, setCustomDurations] = useState({
    focus: 25,
    shortBreak: 5,
    longBreak: 15,
  })

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Initialize audio
  useEffect(() => {
    audioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleQoALJ3n8ptwFgAnmeHxmXMdAB+T2+yHZxoAGI3V55doIQAbj9fojWkkACCS3u6RbCgAJJXg74lnJgAfltvrhWQlABmQ1OaGaykAGo7T5YJpKwAdkt3uimwsACSU4O+HaCoAHpPa64NjJAAbkNTlhmspACGW3u2JbCsAI5Te7ohoJwAcj9Pjf2ElABmM0OB8XyUAG4/T4oFkKQAglt7uimwsACSV4O+HaCoAHpTb64NjJAAck9TlhmspACGW3u2JbCsAI5Te7ohoJwAcj9PjgGIlABmM0OB9XyUAG4/T4oFkKQAgl97uimwsACSW4O+HaCoAHpTb64NjJAAck9Xlh2sqACGX3u2JaysAJJXe7ohpJwAcj9PjgGIlABmN0OB9XyYAHJDU4oFkKQAgl97uimwsACSW4e+HaCoAHpXb64NjJAAclNXlh2sqACGX3u2JaysAJJXf74hpJwAcj9TjgGIlABmN0eB9XyYAHJDV4oFlKQAhmN7uimwsACWX4e+HaCoAH5Xb64RjJAAdlNXlh2sqACKY3+2KaysAJZbf74hpJwAdkNTjgWIlABqO0eB9XyYAHJHV4oFlKQAhmN/uimwsACWX4e+HaCoAH5bb64RjJAAdlNbmh2sqACKY3+2KaysAJpbf74hpJwAdkNTjgWIlABqO0eB+YCYAHZHV4oFlKgAimN/uim0sACWY4u+HaSoAH5bb64RkJAAdldbmh2sqACKZ4O2KaysAJpfg74lpJwAdkdXjgWImABuP0eB+YCYAHZLV4oFmKgAimeDuim0sACWY4u+IaSoAIJbc64RkJQAeltbmh2sqACOZ4O2KaysAJpfg74lpKAAdkdXjgWImABuP0uB+YCcAHZLW4oJmKgAjmeHuim0tACaY4++IaSsAIJbc64VkJQAeltfmh2wrACOZ4O6KaysAJpjg74ppKAAdkdXkgWImABuQ0uB+YCcAHpLW4oJmKgAjmeDuim0tACaZ4++IaSsAIJfc64VkJQAfl9fmh2wrACOa4O6LbCsAJ5jh74ppKAAekdXkgWImABuQ0uB/YScAHpLW44JmKwAjmuHui20tACaZ5O+IaisAIJfc64VkJQAfl9fniG0rACOa4O6LbCsAJ5nh8IppKAAekdXkgmImAByQ0uB/YScAHpPX44JmKwAjmuHui20tACea5O+IaisAIJjc7IVlJgAgl9jniG0sACOa4e6LbCwAJ5nh8IppKAAekdbkgmImAByQ0+B/YScAHpPX44JnKwAkmuHvi20uACea5O+JaisAIZjd7IVlJgAgl9jniG0sACOb4e6LbCwAKJnh8IppKQAfkdbkgmMnAByR0+CAAQcAH5PX44NnKwAkm+Hvi20uACib5O+JaysAIZjd7IZlJgAhmNnniG0sACOb4e+MbCwAKJni8IpqKQAfkdfkgmMnAByR0+CAAQcAH5PY44NnLAAkm+Lvi24uACib5PCJaysAIZnd7IZlJgAhmNnniW4sACOb4u+MbC0AKJni8YpqKQAfkdfkgmMnAByR1OCAAQcAH5TY44NoLAAkm+Lvi24uACic5PCJaysAIpnd7IZmJgAhmdrniW4tACOc4u+MbC0AKJrj8YpqKgAgkdjlg2MoAByS1OCBAQgAIJTY44NoLAAknOLvi24vACic5fCJaysAIprd7YZmJwAimdroiW4tACOc4u+MbS0AKZrj8YtqKgAgktjlg2MoAB2S1OCBAQgAIJTZ5INoLQAknOPwjG4vACic5fCKbCwAIprd7YZmJwAimdroiW4tACOc4/CMbS0AKZrj8YtqKgAgktjlg2QoAB2S1eCBAQgAIJXZ5INoLQAlnOPwjG4vACmc5fCKbCwAIprd7YdmJwAimtroiW4uACOd4/CMbS4AKpvj8YtrKgAgktjlhGQoAB2T1eCCAQgAIJXZ5IRoLQAlnOPwjG8vACmc5fCKbCwAI5ve7YdmJwAimtvoim4uACOd5PCMbS4AKpvk8YtrKwAhk9nlhGQpAB2T1eCCAQkAIJXa5IRpLQAlneTwjG8wACqd5vGKbCwAI5ve7YdnKAAjmtvoim4uACOd5PCMbi4AKpvk8YtrKwAhk9nlhGQpAB2T1uGDAQkAIZXa5IRpLQAlneTwjW8wACqd5vGLbS0AI5ve7YdnKAAjm9voi28uACOd5PCNbi4AKpzk8otrKwAhk9rlhGUpAB6T1uGDAQkAIZba5YRpLgAmneXxjXAwACqd5vGLbS0AJJzf7ohnKAAjm9zoi28vACOe5PCNbi8AK5zk8otrLAAik9rlhGUpAB6U1uGDAQoAIZba5YVpLgAmneXxjXAwACud5/GLbS0AJJzf74hnKQAkm9zoi28vACOe5fCNbi8AK5zl8otrLAAik9vlhWUpAB6U1+KDAQoAIpba5YVpLgAmneXxjnAwACud5/KLbS4AJJzf74hoKQAkm9zpjHAvACOe5fCOby8AK5zl8oxsLAAik9vlhWYpAB6U1+KDAQo=')
    audioRef.current.volume = 0.5
  }, [])

  // Timer logic
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1)
      }, 1000)
    } else if (timeLeft === 0 && isRunning) {
      // Timer completed
      setIsRunning(false)
      if (soundEnabled && audioRef.current) {
        audioRef.current.play().catch(() => {})
      }

      if (mode === 'focus') {
        const newSessionsCompleted = sessionsCompleted + 1
        setSessionsCompleted(newSessionsCompleted)
        onSessionComplete?.(customDurations.focus)

        // Auto switch to break
        if (newSessionsCompleted % 4 === 0) {
          setMode('longBreak')
          const newDuration = customDurations.longBreak * 60
          setDuration(newDuration)
          setTimeLeft(newDuration)
        } else {
          setMode('shortBreak')
          const newDuration = customDurations.shortBreak * 60
          setDuration(newDuration)
          setTimeLeft(newDuration)
        }
      } else {
        // Break completed, switch back to focus
        setMode('focus')
        const newDuration = customDurations.focus * 60
        setDuration(newDuration)
        setTimeLeft(newDuration)
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isRunning, timeLeft, mode, sessionsCompleted, soundEnabled, customDurations, onSessionComplete])

  // Update duration when mode changes manually
  const handleModeChange = useCallback((newMode: TimerMode) => {
    setMode(newMode)
    setIsRunning(false)
    const newDuration = customDurations[newMode] * 60
    setDuration(newDuration)
    setTimeLeft(newDuration)
  }, [customDurations])

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  // Progress percentage
  const progress = ((duration - timeLeft) / duration) * 100

  const config = modeConfig[mode]

  return (
    <div className={cn('flex flex-col items-center', className)}>
      {/* Mode selector */}
      <div className="flex gap-2 mb-8">
        {(Object.keys(modeConfig) as TimerMode[]).map((m) => (
          <button
            key={m}
            onClick={() => handleModeChange(m)}
            className={cn(
              'px-4 py-2 rounded font-mono text-xs uppercase tracking-wider transition-all',
              mode === m
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            )}
          >
            {modeConfig[m].label}
          </button>
        ))}
      </div>

      {/* Timer display */}
      <div className="relative mb-8">
        {/* Progress ring */}
        <svg className="w-64 h-64 transform -rotate-90">
          <circle
            cx="128"
            cy="128"
            r="120"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            className="text-muted"
          />
          <circle
            cx="128"
            cy="128"
            r="120"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={754}
            strokeDashoffset={754 - (754 * progress) / 100}
            className={cn('transition-all duration-1000', config.color)}
          />
        </svg>

        {/* Time display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn(
            'font-mono text-6xl font-bold tabular-nums text-glow-green',
            config.color
          )}>
            {formatTime(timeLeft)}
          </span>
          <span className={cn('font-mono text-sm uppercase tracking-wider mt-2', config.color)}>
            {config.label}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="outline"
          size="icon"
          onClick={() => {
            setIsRunning(false)
            setTimeLeft(duration)
          }}
          className="h-12 w-12 rounded-full"
        >
          <RotateCcw className="w-5 h-5" />
        </Button>

        <Button
          variant="default"
          size="lg"
          onClick={() => setIsRunning(!isRunning)}
          className={cn(
            'h-16 w-16 rounded-full font-mono',
            isRunning ? 'glow-amber' : 'glow-green'
          )}
        >
          {isRunning ? (
            <Pause className="w-6 h-6" />
          ) : (
            <Play className="w-6 h-6 ml-1" />
          )}
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="h-12 w-12 rounded-full"
        >
          {soundEnabled ? (
            <Volume2 className="w-5 h-5" />
          ) : (
            <VolumeX className="w-5 h-5" />
          )}
        </Button>
      </div>

      {/* Session counter */}
      <div className="flex items-center gap-2 mb-6">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={cn(
              'w-3 h-3 rounded-full transition-all',
              i < sessionsCompleted % 4
                ? 'bg-primary glow-green'
                : 'bg-muted'
            )}
          />
        ))}
        <span className="ml-2 text-xs font-mono text-muted-foreground">
          {sessionsCompleted} sessions complete
        </span>
      </div>

      {/* Settings toggle */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowSettings(!showSettings)}
        className="font-mono text-xs"
      >
        <Settings className="w-4 h-4 mr-2" />
        Timer Settings
      </Button>

      {/* Settings panel */}
      {showSettings && (
        <div className="mt-4 p-4 tactical-border rounded-lg w-full max-w-xs">
          <h4 className="text-xs font-mono uppercase text-muted-foreground mb-4">
            Custom Durations (minutes)
          </h4>
          
          {(['focus', 'shortBreak', 'longBreak'] as const).map((key) => (
            <div key={key} className="flex items-center justify-between mb-3">
              <span className="text-sm font-mono capitalize">
                {key === 'shortBreak' ? 'Short Break' : key === 'longBreak' ? 'Long Break' : 'Focus'}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setCustomDurations((prev) => ({
                    ...prev,
                    [key]: Math.max(1, prev[key] - 5),
                  }))}
                >
                  <ChevronDown className="w-4 h-4" />
                </Button>
                <span className="w-8 text-center font-mono">
                  {customDurations[key]}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setCustomDurations((prev) => ({
                    ...prev,
                    [key]: Math.min(120, prev[key] + 5),
                  }))}
                >
                  <ChevronUp className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Back to dashboard */}
      <Button
        variant="ghost"
        className="mt-6 font-mono text-xs"
        onClick={() => window.location.href = '/'}
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Return to Command Center
      </Button>
    </div>
  )
}
