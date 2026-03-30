'use client'

import { useMemo } from 'react'
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'
import { format, parseISO } from 'date-fns'
import type { Progress } from '@/lib/types'

interface StudyChartProps {
  data: Progress[]
}

export function StudyChart({ data }: StudyChartProps) {
  // Process the raw progress data strictly to fill in missing days for a smooth chart
  const chartData = useMemo(() => {
    // We want the last 7 days of data
    const last7Days = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - (6 - i))
      return format(d, 'yyyy-MM-dd')
    })

    const dataMap = new Map(data.map((item) => [item.date, item.hours_studied]))

    return last7Days.map((dateStr) => {
      const val = dataMap.get(dateStr) || 0
      return {
        date: dateStr,
        label: format(parseISO(dateStr), 'MMM dd'),
        hours: val,
      }
    })
  }, [data])

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center py-10 h-[250px] tactical-border rounded-lg bg-card/30 backdrop-blur-md">
        <p className="font-mono text-sm text-muted-foreground">No Intel Available</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 relative">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
          Study Intensity (Last 7 Days)
        </h3>
        <div className="flex items-center gap-2">
           <span className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(0,255,0,0.8)]" />
           <span className="text-[10px] font-mono text-primary uppercase">Live</span>
        </div>
      </div>

      <div className="h-[250px] w-full bg-card/10 rounded-lg overflow-hidden tactical-border p-4 glass-panel group">
        
        {/* Ambient Glow */}
        <div className="absolute inset-0 bg-primary/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid 
              strokeDasharray="3 3" 
              vertical={false} 
              stroke="hsl(var(--border))" 
              opacity={0.4} 
            />
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fontFamily: 'monospace', fill: 'hsl(var(--muted-foreground))' }}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fontFamily: 'monospace', fill: 'hsl(var(--muted-foreground))' }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-background/90 backdrop-blur-md border border-primary/30 p-3 rounded shadow-lg shadow-primary/10">
                      <p className="font-mono text-[10px] text-muted-foreground mb-1 uppercase">
                        {payload[0].payload.label}
                      </p>
                      <p className="font-mono font-bold text-primary text-lg">
                        {payload[0].value} <span className="text-xs font-normal">hrs</span>
                      </p>
                    </div>
                  )
                }
                return null
              }}
            />
            <Area
              type="monotone"
              dataKey="hours"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorHours)"
              activeDot={{ r: 6, fill: 'hsl(var(--primary))', stroke: 'hsl(var(--background))', strokeWidth: 2 }}
              animationDuration={1500}
              animationEasing="ease-in-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
