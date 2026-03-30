'use client'

import { cn } from '@/lib/utils'
import type { AIInsight } from '@/lib/types'
import { Sparkles, TrendingUp, AlertTriangle, Lightbulb, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AIInsightCardProps {
  insight: AIInsight
  onDismiss?: (id: string) => void
  className?: string
}

const typeConfig = {
  motivation: {
    icon: Sparkles,
    color: 'text-neon-green',
    bg: 'bg-neon-green/10',
    border: 'border-neon-green/30',
    label: 'MOTIVATION',
  },
  analysis: {
    icon: TrendingUp,
    color: 'text-neon-cyan',
    bg: 'bg-neon-cyan/10',
    border: 'border-neon-cyan/30',
    label: 'ANALYSIS',
  },
  recommendation: {
    icon: Lightbulb,
    color: 'text-neon-amber',
    bg: 'bg-neon-amber/10',
    border: 'border-neon-amber/30',
    label: 'RECOMMENDATION',
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-neon-red',
    bg: 'bg-neon-red/10',
    border: 'border-neon-red/30',
    label: 'WARNING',
  },
}

export function AIInsightCard({ insight, onDismiss, className }: AIInsightCardProps) {
  const config = typeConfig[insight.insight_type]
  const Icon = config.icon

  return (
    <div className={cn(
      'rounded-lg p-4 border relative overflow-hidden',
      config.bg,
      config.border,
      !insight.is_read && 'ring-1 ring-primary/30',
      className
    )}>
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-primary/5 opacity-50" />

      <div className="relative z-10">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className={cn('p-1.5 rounded', config.bg)}>
              <Icon className={cn('w-4 h-4', config.color)} />
            </div>
            <span className={cn(
              'text-[10px] font-mono font-bold uppercase tracking-wider',
              config.color
            )}>
              {config.label}
            </span>
            {!insight.is_read && (
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            )}
          </div>

          {onDismiss && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-foreground"
              onClick={() => onDismiss(insight.id)}
            >
              <X className="w-3 h-3" />
            </Button>
          )}
        </div>

        <p className="mt-3 text-sm text-foreground leading-relaxed">
          {insight.content}
        </p>

        <div className="mt-3 flex items-center gap-2 text-[10px] font-mono text-muted-foreground">
          <Sparkles className="w-3 h-3 text-primary/50" />
          <span>AI-Generated Insight</span>
          <span className="text-muted-foreground/50">|</span>
          <span>
            {new Date(insight.created_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>
      </div>
    </div>
  )
}
