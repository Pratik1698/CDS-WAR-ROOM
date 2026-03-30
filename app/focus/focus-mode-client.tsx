'use client'

import { useCallback, useState } from 'react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { FocusTimer } from '@/components/war-room/focus-timer'
import { RadarAnimation } from '@/components/war-room/radar-animation'
import { Shield, Crosshair, Zap } from 'lucide-react'

interface FocusModeClientProps {
  userId: string
}

export function FocusModeClient({ userId }: FocusModeClientProps) {
  const [totalMinutesToday, setTotalMinutesToday] = useState(0)
  const supabase = createClient()

  const handleSessionComplete = useCallback(async (minutes: number) => {
    setTotalMinutesToday((prev) => prev + minutes)

    // Log progress to database
    const today = new Date().toISOString().split('T')[0]
    const hours = minutes / 60

    // Get current progress for today
    const { data: existing } = await supabase
      .from('progress')
      .select('hours_studied, tasks_completed')
      .eq('user_id', userId)
      .eq('date', today)
      .single()

    await supabase
      .from('progress')
      .upsert({
        user_id: userId,
        date: today,
        hours_studied: (existing?.hours_studied || 0) + hours,
        tasks_completed: (existing?.tasks_completed || 0) + 1,
      }, {
        onConflict: 'user_id,date',
      })
  }, [supabase, userId])

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Grid overlay */}
      <div className="fixed inset-0 grid-overlay opacity-10 pointer-events-none" />
      
      {/* Scan line effect */}
      <div className="fixed inset-0 scanline pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 p-4 border-b border-border">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-primary" />
            <span className="font-mono text-sm font-bold tracking-wider">
              CDS WAR-ROOM
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-2">
              <Crosshair className="w-4 h-4 text-neon-amber" />
              <span className="text-muted-foreground">FOCUS MODE</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-neon-green" />
              <span className="text-neon-green">ACTIVE</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center p-4 relative z-10">
        <div className="w-full max-w-lg">
          {/* Decorative radar */}
          <div className="flex justify-center mb-8">
            <RadarAnimation size="sm" />
          </div>

          {/* Timer */}
          <FocusTimer onSessionComplete={handleSessionComplete} />

          {/* Today's stats */}
          {totalMinutesToday > 0 && (
            <div className="mt-8 text-center">
              <div className="tactical-border rounded-lg p-4 inline-block">
                <p className="text-[10px] font-mono uppercase text-muted-foreground mb-1">
                  Focus Time Today
                </p>
                <p className="text-2xl font-mono font-bold text-primary text-glow-green">
                  {Math.floor(totalMinutesToday / 60)}h {totalMinutesToday % 60}m
                </p>
              </div>
            </div>
          )}

          {/* Motivational message */}
          <div className="mt-8 text-center">
            <p className="text-sm font-mono text-muted-foreground italic">
              {'"Discipline is the bridge between goals and accomplishment."'}
            </p>
            <p className="text-xs font-mono text-muted-foreground/50 mt-1">
              - Jim Rohn
            </p>
          </div>
        </div>
      </main>

      {/* Corner decorations */}
      <div className="fixed top-4 left-4 w-8 h-8 border-l-2 border-t-2 border-primary/30 pointer-events-none" />
      <div className="fixed top-4 right-4 w-8 h-8 border-r-2 border-t-2 border-primary/30 pointer-events-none" />
      <div className="fixed bottom-4 left-4 w-8 h-8 border-l-2 border-b-2 border-primary/30 pointer-events-none" />
      <div className="fixed bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 border-primary/30 pointer-events-none" />
    </div>
  )
}
