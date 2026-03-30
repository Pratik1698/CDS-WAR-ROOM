'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { RadarAnimation } from './radar-animation'
import { Shield, Radio, Zap } from 'lucide-react'

interface WarRoomHeaderProps {
  displayName?: string
  className?: string
}

export function WarRoomHeader({ displayName, className }: WarRoomHeaderProps) {
  const [mounted, setMounted] = useState(false)
  const [currentTime, setCurrentTime] = useState('--:--:--')

  useEffect(() => {
    setMounted(true)
    const formatTime = () => new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })

    setCurrentTime(formatTime())
    const timer = setInterval(() => setCurrentTime(formatTime()), 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <header className={cn(
      'tactical-border rounded-lg p-4 relative overflow-hidden',
      className
    )}>
      {/* Grid overlay */}
      <div className="absolute inset-0 grid-overlay opacity-30 pointer-events-none" />

      <div className="relative z-10 flex items-center justify-between gap-4">
        {/* Left side - Logo and title */}
        <div className="flex items-center gap-4">
          <RadarAnimation size="sm" />

          <div>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              <h1 className="font-mono text-xl md:text-2xl font-bold tracking-wider text-foreground">
                CDS WAR-ROOM
              </h1>
            </div>
            <p className="text-xs font-mono text-muted-foreground tracking-wider mt-0.5">
              TACTICAL PRODUCTIVITY COMMAND CENTER
            </p>
          </div>
        </div>

        {/* Right side - Status indicators */}
        <div className="hidden md:flex items-center gap-6">
          {/* Connection status */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Radio className="w-4 h-4 text-primary" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-primary rounded-full animate-pulse" />
            </div>
            <span className="text-[10px] font-mono text-primary uppercase">Online</span>
          </div>

          {/* System status */}
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-accent" />
            <span className="text-[10px] font-mono text-accent uppercase">Systems Active</span>
          </div>

          {/* Time display - only render actual time after mount */}
          <div className="font-mono text-lg text-primary tabular-nums text-glow-green min-w-[80px]" suppressHydrationWarning>
            {mounted ? currentTime : '--:--:--'}
          </div>
        </div>

        {/* User greeting */}
        {displayName && (
          <div className="hidden lg:block text-right">
            <p className="text-[10px] font-mono text-muted-foreground uppercase">Operator</p>
            <p className="text-sm font-mono text-foreground">{displayName}</p>
          </div>
        )}
      </div>
    </header>
  )
}
