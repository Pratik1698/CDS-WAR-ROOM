'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import useSWR, { mutate } from 'swr'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import type { Mission, Progress, WeeklyStats, AIInsight, DayActivity } from '@/lib/types'

import { WarRoomHeader } from './war-room-header'
import { ActivityGrid } from './activity-grid'
import { MissionTracker } from './mission-tracker'
import { CountdownPanel } from './countdown-panel'
import { StatPanel } from './stat-panel'
import { ProgressForm } from './progress-form'
import { AIInsightCard } from './ai-insight-card'
import { WeeklyScheduleGrid } from './weekly-schedule-grid'
import { StudyChart } from './study-chart'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import { 
  Clock, 
  Flame, 
  Target, 
  TrendingUp, 
  Sparkles,
  Play,
  RefreshCw,
  CalendarDays,
  LayoutGrid
} from 'lucide-react'

// CDS exam date - adjust as needed
const CDS_EXAM_DATE = new Date('2026-09-15')

interface WarRoomDashboardProps {
  userId: string
  displayName?: string
}

export function WarRoomDashboard({ userId, displayName }: WarRoomDashboardProps) {
  const supabase = createClient()
  const [isSubmittingProgress, setIsSubmittingProgress] = useState(false)
  const [isGeneratingInsight, setIsGeneratingInsight] = useState(false)
  const [activeView, setActiveView] = useState<'schedule' | 'analytics'>('schedule')

  // Fetch real progress for the last 90 days
  const { data: rawProgress = [], mutate: mutateProgress } = useSWR<Progress[]>(
    `progress-${userId}`,
    async () => {
      const ninetyDaysAgo = new Date()
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

      const { data, error } = await supabase
        .from('progress')
        .select('*')
        .eq('user_id', userId)
        .gte('date', ninetyDaysAgo.toISOString().split('T')[0])
        .order('date', { ascending: true })

      if (error) throw error
      return data || []
    }
  )

  // Compute Activity Grid Data from real progress
  const activityData = useMemo(() => {
    const dataMap = new Map<string, number>()
    rawProgress.forEach(p => {
      dataMap.set(p.date, p.hours_studied)
    })

    const data: DayActivity[] = []
    const today = new Date()
    
    for (let i = 90; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      const hours = dataMap.get(dateStr) || 0
      
      const level = hours === 0 ? 0 
        : hours < 2 ? 1 
        : hours < 4 ? 2 
        : hours < 6 ? 3 
        : 4

      data.push({
        date: dateStr,
        hours: Math.round(hours * 10) / 10,
        level: level as 0 | 1 | 2 | 3 | 4,
      })
    }
    return data
  }, [rawProgress])

  // Fetch missions
  const { data: missions = [], mutate: mutateMissions } = useSWR<Mission[]>(
    `missions-${userId}`,
    async () => {
      const { data, error } = await supabase
        .from('missions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data || []
    }
  )

  // Fetch weekly stats
  const { data: weeklyStats } = useSWR<WeeklyStats | null>(
    `weekly-stats-${userId}`,
    async () => {
      const weekStart = new Date()
      weekStart.setDate(weekStart.getDate() - weekStart.getDay())
      weekStart.setHours(0, 0, 0, 0)

      const { data, error } = await supabase
        .from('weekly_stats')
        .select('*')
        .eq('user_id', userId)
        .gte('week_start', weekStart.toISOString())
        .order('week_start', { ascending: false })
        .limit(1)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      return data
    }
  )

  // Fetch AI insights
  const { data: insights = [], mutate: mutateInsights } = useSWR<AIInsight[]>(
    `insights-${userId}`,
    async () => {
      const { data, error } = await supabase
        .from('ai_insights')
        .select('*')
        .eq('user_id', userId)
        .eq('is_read', false)
        .order('created_at', { ascending: false })
        .limit(3)

      if (error) throw error
      return data || []
    }
  )


  // Add new mission
  const handleAddMission = useCallback(async (title: string, priority: Mission['priority']) => {
    const { data, error } = await supabase
      .from('missions')
      .insert({
        user_id: userId,
        title,
        priority,
        status: 'active',
      })
      .select()
      .single()

    if (!error && data) {
      mutateMissions([data, ...missions])
    }
  }, [supabase, userId, missions, mutateMissions])

  // Update mission status
  const handleUpdateMissionStatus = useCallback(async (id: string, status: Mission['status']) => {
    const { error } = await supabase
      .from('missions')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (!error) {
      mutateMissions(
        missions.map((m) => (m.id === id ? { ...m, status } : m))
      )
    }
  }, [supabase, missions, mutateMissions])

  // Submit daily progress
  const handleSubmitProgress = useCallback(async (data: { hours: number; tasks: number; notes: string }) => {
    setIsSubmittingProgress(true)
    try {
      const today = new Date().toISOString().split('T')[0]
      
      const { error } = await supabase
        .from('progress')
        .upsert({
          user_id: userId,
          date: today,
          hours_studied: data.hours,
          tasks_completed: data.tasks,
          notes: data.notes || null,
        }, {
          onConflict: 'user_id,date',
        })

      if (!error) {
        // Re-fetch progress to update the charts automatically
        mutateProgress()

        // Refresh stats
        mutate(`weekly-stats-${userId}`)
      }
    } finally {
      setIsSubmittingProgress(false)
    }
  }, [supabase, userId])

  // Generate AI insight
  const handleGenerateInsight = useCallback(async () => {
    setIsGeneratingInsight(true)
    try {
      const response = await fetch('/api/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          missions: missions.slice(0, 5),
          weeklyStats,
        }),
      })

      if (response.ok) {
        mutateInsights()
      }
    } finally {
      setIsGeneratingInsight(false)
    }
  }, [userId, missions, weeklyStats, mutateInsights])

  // Dismiss insight
  const handleDismissInsight = useCallback(async (id: string) => {
    await supabase
      .from('ai_insights')
      .update({ is_read: true })
      .eq('id', id)

    mutateInsights(insights.filter((i) => i.id !== id))
  }, [supabase, insights, mutateInsights])

  // Calculate stats
  const totalHoursThisWeek = weeklyStats?.total_hours || 0
  const totalTasksThisWeek = weeklyStats?.total_tasks || 0
  const currentStreak = weeklyStats?.streak_days || 0
  const activeMissionCount = missions.filter((m) => m.status === 'active').length

  return (
    <div className="min-h-screen bg-background scanline">
      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        {/* View Tabs */}
        <Tabs value={activeView} onValueChange={(v) => setActiveView(v as 'schedule' | 'analytics')} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2 bg-secondary/30 border border-border">
            <TabsTrigger 
              value="schedule" 
              className="font-mono text-xs uppercase tracking-wider data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <CalendarDays className="w-4 h-4 mr-2" />
              Activity Map
            </TabsTrigger>
            <TabsTrigger 
              value="analytics" 
              className="font-mono text-xs uppercase tracking-wider data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <LayoutGrid className="w-4 h-4 mr-2" />
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* Schedule View - Full Width */}
          <TabsContent value="schedule" className="mt-6">
            <WeeklyScheduleGrid userId={userId} />
          </TabsContent>

          {/* Analytics View - Original Dashboard */}
          <TabsContent value="analytics" className="mt-6">
            {/* Header */}
            <WarRoomHeader displayName={displayName} />

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
              {/* Left Column - Stats and Activity */}
              <div className="lg:col-span-2 space-y-6">
                {/* Countdown Panel */}
                <CountdownPanel
                  targetDate={CDS_EXAM_DATE}
                  label="Time Until CDS Exam"
                />

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <StatPanel
                    label="Hours This Week"
                    value={totalHoursThisWeek.toFixed(1)}
                    subValue="hrs"
                    icon={Clock}
                    variant="success"
                    trend="up"
                    trendValue="2.5"
                  />
                  <StatPanel
                    label="Tasks Completed"
                    value={totalTasksThisWeek}
                    icon={Target}
                    variant="default"
                    trend="up"
                    trendValue="8"
                  />
                  <StatPanel
                    label="Current Streak"
                    value={currentStreak}
                    subValue="days"
                    icon={Flame}
                    variant={currentStreak >= 7 ? 'success' : currentStreak >= 3 ? 'warning' : 'default'}
                  />
                  <StatPanel
                    label="Active Missions"
                    value={activeMissionCount}
                    icon={TrendingUp}
                    variant={activeMissionCount > 0 ? 'warning' : 'default'}
                  />
                </div>

                {/* Charts Area */}
                <div className="space-y-4">
                  <StudyChart data={rawProgress} />
                  <div className="tactical-border rounded-lg p-4 bg-card/20 backdrop-blur-sm">
                    <ActivityGrid data={activityData} />
                  </div>
                </div>

                {/* AI Insights */}
                {insights.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-primary" />
                        AI Combat Intelligence
                      </h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleGenerateInsight}
                        disabled={isGeneratingInsight}
                        className="h-7 px-2 text-xs font-mono"
                      >
                        <RefreshCw className={cn(
                          'w-3 h-3 mr-1',
                          isGeneratingInsight && 'animate-spin'
                        )} />
                        Refresh
                      </Button>
                    </div>
                    <div className="grid gap-3">
                      {insights.map((insight) => (
                        <AIInsightCard
                          key={insight.id}
                          insight={insight}
                          onDismiss={handleDismissInsight}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Generate Insight Button (when no insights) */}
                {insights.length === 0 && (
                  <Button
                    variant="outline"
                    onClick={handleGenerateInsight}
                    disabled={isGeneratingInsight}
                    className="w-full font-mono"
                  >
                    <Sparkles className={cn(
                      'w-4 h-4 mr-2',
                      isGeneratingInsight && 'animate-spin'
                    )} />
                    {isGeneratingInsight ? 'Analyzing Operations...' : 'Generate AI Intelligence Report'}
                  </Button>
                )}
              </div>

              {/* Right Column - Mission Control and Progress */}
              <div className="space-y-6">
                {/* Focus Mode Button */}
                <Button
                  variant="default"
                  size="lg"
                  className="w-full font-mono uppercase tracking-wider glow-green h-14"
                  onClick={() => window.location.href = '/focus'}
                >
                  <Play className="w-5 h-5 mr-2" />
                  Enter Focus Mode
                </Button>

                {/* Progress Form */}
                <ProgressForm
                  onSubmit={handleSubmitProgress}
                  isSubmitting={isSubmittingProgress}
                />

                {/* Mission Tracker */}
                <MissionTracker
                  missions={missions}
                  onAddMission={handleAddMission}
                  onUpdateStatus={handleUpdateMissionStatus}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
