'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Calendar, AlertCircle } from 'lucide-react'

interface CountdownPanelProps {
  targetDate: Date
  label: string
  className?: string
}

interface TimeUnit {
  value: number
  label: string
}

export function CountdownPanel({ targetDate, label, className }: CountdownPanelProps) {
  const [timeLeft, setTimeLeft] = useState<TimeUnit[]>([])
  const [isUrgent, setIsUrgent] = useState(false)

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date()
      const difference = targetDate.getTime() - now.getTime()

      if (difference <= 0) {
        setTimeLeft([
          { value: 0, label: 'DAYS' },
          { value: 0, label: 'HRS' },
          { value: 0, label: 'MIN' },
          { value: 0, label: 'SEC' },
        ])
        return
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24))
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24)
      const minutes = Math.floor((difference / (1000 * 60)) % 60)
      const seconds = Math.floor((difference / 1000) % 60)

      setTimeLeft([
        { value: days, label: 'DAYS' },
        { value: hours, label: 'HRS' },
        { value: minutes, label: 'MIN' },
        { value: seconds, label: 'SEC' },
      ])

      setIsUrgent(days <= 30)
    }

    calculateTimeLeft()
    const timer = setInterval(calculateTimeLeft, 1000)

    return () => clearInterval(timer)
  }, [targetDate])

  return (
    <div className={cn(
      'tactical-border rounded-lg p-4 relative overflow-hidden',
      isUrgent && 'border-neon-red/50',
      className
    )}>
      {/* Scanline effect */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
      </div>

      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-3">
          {isUrgent ? (
            <AlertCircle className="w-4 h-4 text-neon-red animate-pulse" />
          ) : (
            <Calendar className="w-4 h-4 text-primary" />
          )}
          <span className={cn(
            'text-xs font-mono uppercase tracking-wider',
            isUrgent ? 'text-neon-red' : 'text-muted-foreground'
          )}>
            {label}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2">
          {timeLeft.map((unit, index) => (
            <div key={unit.label} className="flex items-center">
              <div className="flex flex-col items-center">
                <div className={cn(
                  'font-mono text-2xl md:text-3xl font-bold tabular-nums',
                  isUrgent ? 'text-neon-red text-glow-green' : 'text-primary text-glow-green'
                )}>
                  {String(unit.value).padStart(2, '0')}
                </div>
                <span className="text-[10px] font-mono text-muted-foreground tracking-wider">
                  {unit.label}
                </span>
              </div>
              {index < timeLeft.length - 1 && (
                <span className={cn(
                  'text-xl font-mono mx-1 animate-pulse',
                  isUrgent ? 'text-neon-red' : 'text-primary/50'
                )}>
                  :
                </span>
              )}
            </div>
          ))}
        </div>

        <div className="mt-3 text-xs font-mono text-muted-foreground">
          Target: {targetDate.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
          })}
        </div>
      </div>
    </div>
  )
}
