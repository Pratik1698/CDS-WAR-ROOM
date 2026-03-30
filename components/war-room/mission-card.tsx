'use client'

import { cn } from '@/lib/utils'
import type { Mission } from '@/lib/types'
import { CheckCircle2, Circle, AlertTriangle, Target, Clock } from 'lucide-react'

interface MissionCardProps {
  mission: Mission
  onStatusChange?: (id: string, status: Mission['status']) => void
  className?: string
}

const priorityConfig = {
  low: { color: 'text-muted-foreground', bg: 'bg-muted', label: 'LOW' },
  medium: { color: 'text-neon-cyan', bg: 'bg-neon-cyan/10', label: 'MED' },
  high: { color: 'text-neon-amber', bg: 'bg-neon-amber/10', label: 'HIGH' },
  critical: { color: 'text-neon-red', bg: 'bg-neon-red/10', label: 'CRIT' },
}

export function MissionCard({ mission, onStatusChange, className }: MissionCardProps) {
  const priority = priorityConfig[mission.priority]
  const isCompleted = mission.status === 'completed'

  const handleToggle = () => {
    if (onStatusChange) {
      onStatusChange(mission.id, isCompleted ? 'active' : 'completed')
    }
  }

  const daysUntilTarget = mission.target_date
    ? Math.ceil((new Date(mission.target_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null

  return (
    <div
      className={cn(
        'tactical-border rounded-md p-3 transition-all duration-300',
        'hover:border-primary/50 group',
        isCompleted && 'opacity-60',
        className
      )}
    >
      <div className="flex items-start gap-3">
        <button
          onClick={handleToggle}
          className="mt-0.5 transition-colors"
          aria-label={isCompleted ? 'Mark as active' : 'Mark as completed'}
        >
          {isCompleted ? (
            <CheckCircle2 className="w-5 h-5 text-primary" />
          ) : (
            <Circle className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={cn(
              'px-1.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase',
              priority.bg,
              priority.color
            )}>
              {priority.label}
            </span>
            {mission.priority === 'critical' && (
              <AlertTriangle className="w-3.5 h-3.5 text-neon-red animate-pulse" />
            )}
          </div>

          <h4 className={cn(
            'font-mono text-sm font-medium text-foreground truncate',
            isCompleted && 'line-through'
          )}>
            {mission.title}
          </h4>

          {mission.description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {mission.description}
            </p>
          )}

          {daysUntilTarget !== null && (
            <div className={cn(
              'flex items-center gap-1 mt-2 text-xs font-mono',
              daysUntilTarget <= 3 ? 'text-neon-red' : 
              daysUntilTarget <= 7 ? 'text-neon-amber' : 
              'text-muted-foreground'
            )}>
              <Clock className="w-3 h-3" />
              <span>
                {daysUntilTarget < 0
                  ? `${Math.abs(daysUntilTarget)}d overdue`
                  : daysUntilTarget === 0
                  ? 'Due today'
                  : `${daysUntilTarget}d remaining`}
              </span>
            </div>
          )}
        </div>

        <Target className="w-4 h-4 text-primary/30 group-hover:text-primary/60 transition-colors" />
      </div>
    </div>
  )
}
