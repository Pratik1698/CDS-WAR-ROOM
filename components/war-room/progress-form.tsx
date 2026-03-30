'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Clock, CheckSquare, FileText, Send } from 'lucide-react'

interface ProgressFormProps {
  onSubmit: (data: { hours: number; tasks: number; notes: string }) => void
  isSubmitting?: boolean
  className?: string
}

export function ProgressForm({ onSubmit, isSubmitting, className }: ProgressFormProps) {
  const [hours, setHours] = useState('')
  const [tasks, setTasks] = useState('')
  const [notes, setNotes] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      hours: parseFloat(hours) || 0,
      tasks: parseInt(tasks) || 0,
      notes: notes.trim(),
    })
    setHours('')
    setTasks('')
    setNotes('')
  }

  return (
    <div className={cn('tactical-border rounded-lg p-4', className)}>
      <h3 className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
        <Send className="w-4 h-4 text-primary" />
        Log Daily Progress
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-[10px] font-mono uppercase text-muted-foreground flex items-center gap-1.5">
              <Clock className="w-3 h-3" />
              Hours Studied
            </label>
            <Input
              type="number"
              step="0.5"
              min="0"
              max="24"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              placeholder="0.0"
              className="font-mono text-lg h-12 text-center"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-mono uppercase text-muted-foreground flex items-center gap-1.5">
              <CheckSquare className="w-3 h-3" />
              Tasks Completed
            </label>
            <Input
              type="number"
              min="0"
              value={tasks}
              onChange={(e) => setTasks(e.target.value)}
              placeholder="0"
              className="font-mono text-lg h-12 text-center"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-mono uppercase text-muted-foreground flex items-center gap-1.5">
            <FileText className="w-3 h-3" />
            Mission Notes (Optional)
          </label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="What did you accomplish today?..."
            className="font-mono text-sm resize-none"
            rows={3}
          />
        </div>

        <Button
          type="submit"
          disabled={isSubmitting || (!hours && !tasks)}
          className="w-full font-mono uppercase tracking-wider"
        >
          {isSubmitting ? 'Transmitting...' : 'Submit Report'}
        </Button>
      </form>
    </div>
  )
}
