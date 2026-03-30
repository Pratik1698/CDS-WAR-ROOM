'use client'

import { cn } from '@/lib/utils'

interface RadarAnimationProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

const sizeConfig = {
  sm: 'w-16 h-16',
  md: 'w-24 h-24',
  lg: 'w-32 h-32',
}

export function RadarAnimation({ className, size = 'md' }: RadarAnimationProps) {
  return (
    <div className={cn('relative', sizeConfig[size], className)}>
      {/* Outer ring */}
      <div className="absolute inset-0 rounded-full border border-primary/30" />
      
      {/* Middle ring */}
      <div className="absolute inset-2 rounded-full border border-primary/20" />
      
      {/* Inner ring */}
      <div className="absolute inset-4 rounded-full border border-primary/10" />
      
      {/* Center dot */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
      </div>
      
      {/* Radar sweep */}
      <div 
        className="absolute inset-0 rounded-full overflow-hidden"
        style={{ animation: 'radar-sweep 4s linear infinite' }}
      >
        <div 
          className="absolute top-1/2 left-1/2 w-1/2 h-0.5 origin-left"
          style={{
            background: 'linear-gradient(90deg, var(--neon-green) 0%, transparent 100%)',
            transform: 'translateY(-50%)',
          }}
        />
      </div>
      
      {/* Glow effect */}
      <div className="absolute inset-0 rounded-full bg-primary/5 blur-md" />
    </div>
  )
}
