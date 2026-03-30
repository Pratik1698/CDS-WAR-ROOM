'use client'

import { cn } from '@/lib/utils'
import { type LucideIcon } from 'lucide-react'

interface StatPanelProps {
  label: string
  value: string | number
  subValue?: string
  icon: LucideIcon
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string
  variant?: 'default' | 'success' | 'warning' | 'danger'
  className?: string
}

const variantStyles = {
  default: 'text-primary drop-shadow-[0_0_5px_rgba(0,255,0,0.5)]',
  success: 'text-neon-green drop-shadow-[0_0_8px_rgba(0,255,0,0.8)]',
  warning: 'text-neon-amber drop-shadow-[0_0_8px_rgba(255,191,0,0.8)]',
  danger: 'text-neon-red drop-shadow-[0_0_8px_rgba(255,0,0,0.8)]',
}

const variantGradients = {
  default: 'from-primary/20',
  success: 'from-neon-green/20',
  warning: 'from-neon-amber/20',
  danger: 'from-neon-red/20',
}

export function StatPanel({
  label,
  value,
  subValue,
  icon: Icon,
  trend,
  trendValue,
  variant = 'default',
  className,
}: StatPanelProps) {
  return (
    <div className={cn(
      'tactical-border rounded-xl p-4 relative overflow-hidden group bg-card/20 backdrop-blur-sm',
      'hover:border-primary/60 hover:-translate-y-1 transition-all duration-300 hover:shadow-[0_0_15px_rgba(0,255,0,0.15)]',
      className
    )}>
      {/* Background glow effect */}
      <div className={cn(
        'absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-2xl pointer-events-none',
        'bg-gradient-to-br to-transparent',
        variantGradients[variant]
      )} />

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-2">
          <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
            {label}
          </span>
          <Icon className={cn('w-4 h-4', variantStyles[variant])} />
        </div>

        <div className="flex items-baseline gap-2">
          <span className={cn(
            'text-2xl md:text-3xl font-mono font-bold tabular-nums',
            variantStyles[variant]
          )}>
            {value}
          </span>
          {subValue && (
            <span className="text-xs font-mono text-muted-foreground">
              {subValue}
            </span>
          )}
        </div>

        {trend && trendValue && (
          <div className={cn(
            'flex items-center gap-1 mt-2 text-xs font-mono',
            trend === 'up' && 'text-neon-green',
            trend === 'down' && 'text-neon-red',
            trend === 'neutral' && 'text-muted-foreground'
          )}>
            <span>
              {trend === 'up' && '+'}{trendValue}
            </span>
            <span className="text-muted-foreground">vs last week</span>
          </div>
        )}
      </div>
    </div>
  )
}
