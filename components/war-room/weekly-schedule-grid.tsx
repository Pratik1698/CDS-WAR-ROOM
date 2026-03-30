"use client"

import { useState, useEffect, useCallback } from "react"
import { Check, ChevronDown, Pencil, Trash2, Plus, ArrowUp, ArrowDown } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import type { ScheduleSlot, ScheduleCompletion } from "@/lib/types"

interface WeeklyScheduleGridProps {
  userId: string
}

const DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"]

const DEFAULT_SLOTS = [
  { time_label: "05:00 AM", activity_name: "WAKE UP & HYDRATE", sort_order: 1 },
  { time_label: "05:30 AM", activity_name: "PHYSICAL TRAINING", sort_order: 2 },
  { time_label: "07:15 AM", activity_name: "GS: SCIENCE/POLITY", sort_order: 3 },
  { time_label: "09:00 AM", activity_name: "COLLEGE & LABS", sort_order: 4 },
  { time_label: "05:30 PM", activity_name: "EVENING WALK/SPORTS", sort_order: 5 },
  { time_label: "06:30 PM", activity_name: "B.TECH CORE (8.5+)", sort_order: 6 },
  { time_label: "09:00 PM", activity_name: "CDS MATH/ENGLISH", sort_order: 7 },
  { time_label: "10:30 PM", activity_name: "CURRENT AFFAIRS", sort_order: 8 },
]

function getWeekNumber(date: Date): number {
  const startOfYear = new Date(date.getFullYear(), 0, 1)
  const days = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000))
  return Math.ceil((days + startOfYear.getDay() + 1) / 7)
}

function getWeekYear(date: Date): string {
  return `${date.getFullYear()}-W${String(getWeekNumber(date)).padStart(2, "0")}`
}

function getWeeksForDropdown(baseDate: Date): { value: string; label: string; isActive: boolean }[] {
  const weeks: { value: string; label: string; isActive: boolean }[] = []
  const currentWeekYear = getWeekYear(baseDate)

  for (let i = -4; i <= 2; i++) {
    const date = new Date(baseDate)
    date.setDate(date.getDate() + i * 7)
    const weekYear = getWeekYear(date)
    const isActive = weekYear === currentWeekYear
    weeks.push({
      value: weekYear,
      label: `${weekYear}${isActive ? " (Active)" : ""}`,
      isActive,
    })
  }

  return weeks
}

function getCurrentDayIndex(date: Date): number {
  const day = date.getDay()
  return day === 0 ? 6 : day - 1
}

// Static initial week for SSR consistency
const INITIAL_WEEK = "2026-W14"

export function WeeklyScheduleGrid({ userId }: WeeklyScheduleGridProps) {
  const [slots, setSlots] = useState<ScheduleSlot[]>([])
  const [completions, setCompletions] = useState<Record<string, boolean>>({})
  const [selectedWeek, setSelectedWeek] = useState(INITIAL_WEEK)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [now, setNow] = useState<Date | null>(null)

  // Edit Mode state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingSlots, setEditingSlots] = useState<ScheduleSlot[]>([])
  const [deletedSlotIds, setDeletedSlotIds] = useState<string[]>([])
  const [isSaving, setIsSaving] = useState(false)

  const supabase = createClient()

  // Initialize on client only
  useEffect(() => {
    const currentDate = new Date()
    setMounted(true)
    setNow(currentDate)
    setSelectedWeek(getWeekYear(currentDate))

    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const weeks = mounted && now ? getWeeksForDropdown(now) : []
  const currentDayIndex = mounted && now ? getCurrentDayIndex(now) : 0
  const isCurrentWeek = mounted && now ? selectedWeek === getWeekYear(now) : false

  // Load slots and completions
  const loadData = useCallback(async () => {
    if (!mounted) return
    setIsLoading(true)

    const { data: userSlots } = await supabase
      .from("schedule_slots")
      .select("*")
      .eq("user_id", userId)
      .order("sort_order")

    if (userSlots && userSlots.length > 0) {
      setSlots(userSlots)
    } else {
      const defaultSlotsWithUser = DEFAULT_SLOTS.map((slot) => ({
        ...slot,
        user_id: userId,
      }))

      const { data: createdSlots } = await supabase
        .from("schedule_slots")
        .insert(defaultSlotsWithUser)
        .select()

      if (createdSlots) {
        setSlots(createdSlots)
      }
    }

    const { data: weekCompletions } = await supabase
      .from("schedule_completions")
      .select("*")
      .eq("user_id", userId)
      .eq("week_year", selectedWeek)

    const completionMap: Record<string, boolean> = {}
    weekCompletions?.forEach((c: ScheduleCompletion) => {
      completionMap[`${c.slot_id}-${c.day_of_week}`] = c.completed
    })
    setCompletions(completionMap)
    setIsLoading(false)
  }, [userId, selectedWeek, supabase, mounted])

  useEffect(() => {
    if (mounted) {
      loadData()
    }
  }, [loadData, mounted])

  const toggleCompletion = async (slotId: string, dayIndex: number) => {
    const key = `${slotId}-${dayIndex}`
    const newValue = !completions[key]

    setCompletions((prev) => ({ ...prev, [key]: newValue }))

    const { data: existing } = await supabase
      .from("schedule_completions")
      .select("id")
      .eq("user_id", userId)
      .eq("slot_id", slotId)
      .eq("week_year", selectedWeek)
      .eq("day_of_week", dayIndex)
      .single()

    if (existing) {
      await supabase
        .from("schedule_completions")
        .update({ completed: newValue })
        .eq("id", existing.id)
    } else {
      await supabase.from("schedule_completions").insert({
        user_id: userId,
        slot_id: slotId,
        week_year: selectedWeek,
        day_of_week: dayIndex,
        completed: newValue,
      })
    }
  }

  // Edit Schedule Handlers
  const startEditing = () => {
    setEditingSlots([...slots])
    setDeletedSlotIds([])
    setIsEditModalOpen(true)
  }

  const handleUpdateSlot = (index: number, field: 'time_label' | 'activity_name', value: string) => {
    const newSlots = [...editingSlots]
    newSlots[index] = { ...newSlots[index], [field]: value }
    setEditingSlots(newSlots)
  }

  const handleRemoveSlot = (index: number) => {
    const slotToRemove = editingSlots[index]
    if (slotToRemove.id && !slotToRemove.id.startsWith("new-")) {
      setDeletedSlotIds([...deletedSlotIds, slotToRemove.id])
    }
    const newSlots = [...editingSlots]
    newSlots.splice(index, 1)
    setEditingSlots(newSlots)
  }

  const handleAddSlot = () => {
    const newSlot: ScheduleSlot = {
      id: `new-${Date.now()}`,
      user_id: userId,
      time_label: "12:00 PM",
      activity_name: "NEW ACTIVITY",
      sort_order: editingSlots.length + 1,
      created_at: new Date().toISOString()
    }
    setEditingSlots([...editingSlots, newSlot])
  }

  const handleMoveSlot = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return
    if (direction === 'down' && index === editingSlots.length - 1) return

    const newSlots = [...editingSlots]
    const dest = direction === 'up' ? index - 1 : index + 1
    const temp = newSlots[index]
    newSlots[index] = newSlots[dest]
    newSlots[dest] = temp
    setEditingSlots(newSlots)
  }

  const handleSaveSchedule = async () => {
    setIsSaving(true)

    // 1. Delete slots
    if (deletedSlotIds.length > 0) {
      await supabase
        .from("schedule_slots")
        .delete()
        .in("id", deletedSlotIds)
    }

    // 2. Separate inserts and updates
    const updates: any[] = []
    const inserts: any[] = []

    editingSlots.forEach((slot, index) => {
      const dbSlot = {
        user_id: slot.user_id,
        time_label: slot.time_label,
        activity_name: slot.activity_name,
        sort_order: index + 1,
      }

      if (slot.id.startsWith("new-")) {
        inserts.push(dbSlot)
      } else {
        updates.push({ ...dbSlot, id: slot.id })
      }
    })

    if (inserts.length > 0) {
      await supabase.from("schedule_slots").insert(inserts)
    }
    if (updates.length > 0) {
      await supabase.from("schedule_slots").upsert(updates)
    }

    setIsEditModalOpen(false)
    setIsSaving(false)
    await loadData()
  }

  const totalCells = slots.length * 7
  const completedCells = Object.values(completions).filter(Boolean).length
  const readinessPercent = totalCells > 0 ? Math.round((completedCells / totalCells) * 100) : 0

  const formatDate = () => {
    if (!now) return "LOADING..."
    return now.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }).toUpperCase()
  }

  const formatTime = () => {
    if (!now) return "--:--:-- --"
    return now.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    })
  }

  return (
    <div className="w-full space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-wider text-primary text-glow-green font-mono">
            CDS WAR-ROOM
          </h1>
          <p className="text-xs text-muted-foreground font-mono tracking-widest mt-1" suppressHydrationWarning>
            {mounted ? formatDate() : "LOADING..."}
          </p>
          <p className="text-3xl font-mono text-foreground mt-2 tabular-nums" suppressHydrationWarning>
            {mounted ? formatTime() : "--:--:-- --"}
          </p>
        </div>

        <div className="text-right flex flex-col items-end gap-2">
          {/* Week selector */}
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 bg-secondary/50 border border-border rounded text-xs font-mono text-primary hover:bg-secondary transition-colors"
            >
              <span className="text-muted-foreground">VIEW WEEK:</span>
              <span suppressHydrationWarning>{mounted ? (weeks.find((w) => w.value === selectedWeek)?.label || selectedWeek) : INITIAL_WEEK}</span>
              <ChevronDown className="w-3 h-3" />
            </button>

            {isDropdownOpen && mounted && (
              <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded shadow-lg z-50 min-w-[180px]">
                {weeks.map((week) => (
                  <button
                    key={week.value}
                    onClick={() => {
                      setSelectedWeek(week.value)
                      setIsDropdownOpen(false)
                    }}
                    className={`w-full px-3 py-2 text-left text-xs font-mono hover:bg-secondary transition-colors ${week.value === selectedWeek ? "text-primary bg-secondary/50" : "text-foreground"
                      } ${week.isActive ? "text-primary" : ""}`}
                  >
                    {week.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <Button
            onClick={startEditing}
            size="sm"
            variant="outline"
            className="w-full justify-center bg-secondary/30 border-border hover:bg-secondary text-xs font-mono text-primary h-8"
          >
            <Pencil className="w-3 h-3 mr-2" />
            EDIT SCHEDULE
          </Button>

          {/* Weekly readiness */}
          <div className="text-right">
            <p className="text-xs text-muted-foreground font-mono tracking-widest">
              WEEKLY READINESS
            </p>
            <p className={`text-4xl font-bold font-mono ${readinessPercent >= 80 ? "text-primary text-glow-green" :
              readinessPercent >= 50 ? "text-accent" :
                "text-destructive"
              }`}>
              {readinessPercent}%
            </p>
          </div>
        </div>
      </div>

      {/* Activity Map Grid */}
      <div className="border border-primary/30 rounded-lg overflow-hidden bg-card/30">
        {/* Grid Header */}
        <div className="grid grid-cols-[minmax(200px,1fr)_repeat(7,1fr)] border-b border-primary/30">
          <div className="px-4 py-3 border-r border-primary/30">
            <span className="text-xs font-mono text-muted-foreground tracking-widest">
              ACTIVITY MAP
            </span>
          </div>
          {DAYS.map((day, index) => (
            <div
              key={day}
              className={`px-2 py-3 text-center border-r border-primary/30 last:border-r-0 ${mounted && isCurrentWeek && index === currentDayIndex ? "bg-primary/10" : ""
                }`}
            >
              <span className={`text-xs font-mono tracking-wider ${mounted && isCurrentWeek && index === currentDayIndex ? "text-primary font-bold" : "text-muted-foreground"
                }`}>
                {day}
              </span>
            </div>
          ))}
        </div>

        {/* Grid Body */}
        {!mounted || isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : slots.length === 0 ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground font-mono text-sm">
            No schedule slots found. Creating defaults...
          </div>
        ) : (
          slots.map((slot) => (
            <div
              key={slot.id}
              className="grid grid-cols-[minmax(200px,1fr)_repeat(7,1fr)] border-b border-primary/20 last:border-b-0 hover:bg-secondary/20 transition-colors"
            >
              {/* Activity label */}
              <div className="px-4 py-4 border-r border-primary/20 flex flex-col justify-center">
                <span className="text-xs font-mono text-primary tracking-wide">
                  {slot.time_label}
                </span>
                <span className="text-sm font-mono text-foreground tracking-wider uppercase">
                  {slot.activity_name}
                </span>
              </div>

              {/* Day cells */}
              {DAYS.map((_, dayIndex) => {
                const key = `${slot.id}-${dayIndex}`
                const isCompleted = completions[key]
                const isToday = isCurrentWeek && dayIndex === currentDayIndex

                return (
                  <div
                    key={dayIndex}
                    className={`flex items-center justify-center p-3 border-r border-primary/20 last:border-r-0 ${isToday ? "bg-primary/5" : ""
                      }`}
                  >
                    <button
                      onClick={() => toggleCompletion(slot.id, dayIndex)}
                      className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center transition-all duration-200 ${isCompleted
                        ? "bg-primary border-primary glow-green"
                        : "bg-secondary/30 border-border hover:border-primary/50 hover:bg-secondary/50"
                        }`}
                      aria-label={`Mark ${slot.activity_name} as ${isCompleted ? "incomplete" : "complete"} for ${DAYS[dayIndex]}`}
                    >
                      {isCompleted && (
                        <Check className="w-5 h-5 text-primary-foreground" strokeWidth={3} />
                      )}
                    </button>
                  </div>
                )
              })}
            </div>
          ))
        )}
      </div>

      {/* Footer Panels */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border border-border rounded-lg p-4 bg-card/30">
          <p className="text-xs font-mono text-muted-foreground tracking-widest mb-2">
            TECHNICAL GOAL
          </p>
          <p className="text-sm font-mono text-foreground">
            Maintain <span className="text-primary">8.5+ CGPA</span> for TGC/SSC-Tech eligibility.
          </p>
        </div>

        <div className="border border-border rounded-lg p-4 bg-card/30">
          <p className="text-xs font-mono text-muted-foreground tracking-widest mb-2">
            COUNTDOWN
          </p>
          <p className="text-sm font-mono text-foreground">
            CDS 2 2027: <span className="text-primary animate-pulse">TARGET ACQUIRED</span>
          </p>
        </div>

        <div className="border border-border rounded-lg p-4 bg-card/30">
          <p className="text-xs font-mono text-muted-foreground tracking-widest mb-2">
            SYSTEM NOTE
          </p>
          <p className="text-sm font-mono text-muted-foreground">
            Switch weeks via the dropdown to view your historical mission logs.
          </p>
        </div>
      </div>

      {/* Edit Schedule Dialog */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-xl bg-card border border-primary/20 text-foreground">
          <DialogHeader>
            <DialogTitle className="font-mono text-primary flex items-center gap-2 tracking-wider">
              <Pencil className="w-4 h-4" />
              edit_schedule.exe
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar my-4">
            {editingSlots.map((slot, index) => (
              <div key={slot.id} className="flex items-center gap-2 p-3 bg-secondary/20 border border-primary/20 rounded-md">
                <div className="flex flex-col gap-1 pr-2 border-r border-primary/20">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-primary"
                    onClick={() => handleMoveSlot(index, 'up')}
                    disabled={index === 0}
                  >
                    <ArrowUp className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-primary"
                    onClick={() => handleMoveSlot(index, 'down')}
                    disabled={index === editingSlots.length - 1}
                  >
                    <ArrowDown className="w-4 h-4" />
                  </Button>
                </div>

                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-muted-foreground w-16">TIME</span>
                    <Input
                      value={slot.time_label}
                      onChange={(e) => handleUpdateSlot(index, 'time_label', e.target.value)}
                      className="font-mono text-xs h-8 bg-background border-border"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-muted-foreground w-16">ACTIVITY</span>
                    <Input
                      value={slot.activity_name}
                      onChange={(e) => handleUpdateSlot(index, 'activity_name', e.target.value)}
                      className="font-mono text-xs uppercase h-8 bg-background border-border"
                    />
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 text-destructive/80 hover:text-destructive hover:bg-destructive/10 ml-2"
                  onClick={() => handleRemoveSlot(index)}
                >
                  <Trash2 className="w-5 h-5" />
                </Button>
              </div>
            ))}

            <Button
              onClick={handleAddSlot}
              variant="outline"
              className="w-full bg-secondary/10 hover:bg-secondary border border-dashed border-primary/30 text-primary mt-4 py-8 rounded-md font-mono"
            >
              <Plus className="w-4 h-4 mr-2" />
              ADD MISSION SLOT
            </Button>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)} className="font-mono text-xs">
              CANCEL
            </Button>
            <Button
              onClick={handleSaveSchedule}
              disabled={isSaving}
              className="bg-primary hover:bg-primary/90 text-primary-foreground min-w-[120px] font-mono text-xs"
            >
              {isSaving ? "SAVING..." : "SAVE ARCHITECTURE"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
