'use client'

import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import type { DayActivity } from '@/lib/types'

interface ActivityGridProps {
  data: DayActivity[]
  className?: string
}

export function ActivityGrid({ data, className }: ActivityGridProps) {
  const weeks = useMemo(() => {
    // Group data into weeks (7 days each)
    const weekData: DayActivity[][] = []
    for (let i = 0; i < data.length; i += 7) {
      weekData.push(data.slice(i, i + 7))
    }
    return weekData
  }, [data])

  const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
          Weekly Activity Matrix
        </h3>
        <div className="flex items-center gap-1 text-xs font-mono text-muted-foreground">
          <span>Less</span>
          <div className="flex gap-0.5">
            {[0, 1, 2, 3, 4].map((level) => (
              <div
                key={level}
                className={cn(
                  'w-2.5 h-2.5 rounded-sm',
                  `activity-level-${level}`
                )}
              />
            ))}
          </div>
          <span>More</span>
        </div>
      </div>
      
      <div className="flex gap-1">
        {/* Day labels */}
        <div className="flex flex-col gap-0.5 mr-1">
          {dayLabels.map((day, i) => (
            <div
              key={i}
              className="w-3 h-3 flex items-center justify-center text-[8px] font-mono text-muted-foreground"
            >
              {i % 2 === 0 ? day : ''}
            </div>
          ))}
        </div>
        
        {/* Activity cells */}
        <div className="flex gap-0.5 overflow-x-auto">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-0.5">
              {week.map((day, dayIndex) => (
                <div
                  key={`${weekIndex}-${dayIndex}`}
                  className={cn(
                    'w-3 h-3 rounded-sm transition-all duration-200 hover:ring-1 hover:ring-primary cursor-pointer',
                    `activity-level-${day.level}`
                  )}
                  title={`${day.date}: ${day.hours}h studied`}
                />
              ))}
              {/* Fill empty days */}
              {Array.from({ length: 7 - week.length }).map((_, i) => (
                <div
                  key={`empty-${weekIndex}-${i}`}
                  className="w-3 h-3 rounded-sm activity-level-0"
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
