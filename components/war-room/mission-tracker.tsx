'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import type { Mission } from '@/lib/types'
import { MissionCard } from './mission-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Target, Filter } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface MissionTrackerProps {
  missions: Mission[]
  onAddMission: (title: string, priority: Mission['priority']) => void
  onUpdateStatus: (id: string, status: Mission['status']) => void
  className?: string
}

export function MissionTracker({
  missions,
  onAddMission,
  onUpdateStatus,
  className,
}: MissionTrackerProps) {
  const [newMissionTitle, setNewMissionTitle] = useState('')
  const [newMissionPriority, setNewMissionPriority] = useState<Mission['priority']>('medium')
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all')
  const [showAddForm, setShowAddForm] = useState(false)

  const filteredMissions = missions.filter((m) => {
    if (filter === 'all') return m.status !== 'archived'
    if (filter === 'active') return m.status === 'active'
    if (filter === 'completed') return m.status === 'completed'
    return true
  })

  const activeMissions = missions.filter((m) => m.status === 'active').length
  const completedMissions = missions.filter((m) => m.status === 'completed').length

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (newMissionTitle.trim()) {
      onAddMission(newMissionTitle.trim(), newMissionPriority)
      setNewMissionTitle('')
      setNewMissionPriority('medium')
      setShowAddForm(false)
    }
  }

  return (
    <div className={cn('tactical-border rounded-lg overflow-hidden', className)}>
      {/* Header */}
      <div className="p-4 border-b border-border bg-card/50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            <h2 className="font-mono text-sm font-bold uppercase tracking-wider text-foreground">
              Mission Control
            </h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAddForm(!showAddForm)}
            className="h-8 px-2 text-xs font-mono"
          >
            <Plus className="w-4 h-4 mr-1" />
            NEW
          </Button>
        </div>

        {/* Stats bar */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-neon-amber" />
            <span className="text-muted-foreground">Active:</span>
            <span className="text-neon-amber font-bold">{activeMissions}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-neon-green" />
            <span className="text-muted-foreground">Complete:</span>
            <span className="text-neon-green font-bold">{completedMissions}</span>
          </div>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2 mt-3">
          <Filter className="w-3.5 h-3.5 text-muted-foreground" />
          <div className="flex gap-1">
            {(['all', 'active', 'completed'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  'px-2 py-1 text-[10px] font-mono uppercase rounded transition-colors',
                  filter === f
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Add Mission Form */}
      {showAddForm && (
        <form onSubmit={handleSubmit} className="p-4 border-b border-border bg-muted/30">
          <div className="flex flex-col gap-3">
            <Input
              value={newMissionTitle}
              onChange={(e) => setNewMissionTitle(e.target.value)}
              placeholder="Enter mission objective..."
              className="font-mono text-sm bg-background/50"
              autoFocus
            />
            <div className="flex items-center gap-2">
              <Select
                value={newMissionPriority}
                onValueChange={(v) => setNewMissionPriority(v as Mission['priority'])}
              >
                <SelectTrigger className="w-32 h-8 text-xs font-mono">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low" className="text-xs font-mono">LOW</SelectItem>
                  <SelectItem value="medium" className="text-xs font-mono">MEDIUM</SelectItem>
                  <SelectItem value="high" className="text-xs font-mono">HIGH</SelectItem>
                  <SelectItem value="critical" className="text-xs font-mono">CRITICAL</SelectItem>
                </SelectContent>
              </Select>
              <Button type="submit" size="sm" className="h-8 text-xs font-mono">
                Deploy Mission
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowAddForm(false)}
                className="h-8 text-xs font-mono"
              >
                Cancel
              </Button>
            </div>
          </div>
        </form>
      )}

      {/* Mission List */}
      <div className="p-4 max-h-[400px] overflow-y-auto space-y-2">
        {filteredMissions.length === 0 ? (
          <div className="text-center py-8">
            <Target className="w-8 h-8 mx-auto text-muted-foreground/30 mb-2" />
            <p className="text-sm font-mono text-muted-foreground">
              No missions found
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Deploy a new mission to begin operations
            </p>
          </div>
        ) : (
          filteredMissions.map((mission) => (
            <MissionCard
              key={mission.id}
              mission={mission}
              onStatusChange={onUpdateStatus}
            />
          ))
        )}
      </div>
    </div>
  )
}
