import { generateText, Output } from 'ai'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import type { Mission, WeeklyStats } from '@/lib/types'

export const maxDuration = 30

const insightSchema = z.object({
  insight_type: z.enum(['motivation', 'analysis', 'recommendation', 'warning']),
  content: z.string().describe('The insight message, 1-3 sentences, encouraging and tactical military tone'),
})

export async function POST(req: Request) {
  try {
    const { userId, missions, weeklyStats } = await req.json() as {
      userId: string
      missions: Mission[]
      weeklyStats: WeeklyStats | null
    }

    // Build context for the AI
    const activeMissions = missions.filter(m => m.status === 'active')
    const completedMissions = missions.filter(m => m.status === 'completed')
    const criticalMissions = activeMissions.filter(m => m.priority === 'critical' || m.priority === 'high')

    const contextParts = [
      `Weekly Stats: ${weeklyStats ? `${weeklyStats.total_hours} hours studied, ${weeklyStats.total_tasks} tasks completed, ${weeklyStats.streak_days} day streak` : 'No data yet'}`,
      `Active Missions: ${activeMissions.length} (${criticalMissions.length} high priority)`,
      `Completed Missions: ${completedMissions.length}`,
      activeMissions.length > 0 
        ? `Current mission titles: ${activeMissions.slice(0, 3).map(m => m.title).join(', ')}`
        : '',
    ].filter(Boolean).join('\n')

    const result = await generateText({
      model: 'openai/gpt-5-mini',
      system: `You are a tactical AI assistant in a military-themed productivity app called "CDS WAR-ROOM" designed for CDS (Combined Defence Services) exam preparation. 
      
Your role is to provide brief, motivating insights using military terminology while being supportive and encouraging. Keep messages concise (1-3 sentences).

Insight types to use:
- motivation: Inspiring messages to keep the user going
- analysis: Brief analysis of their progress patterns
- recommendation: Actionable tactical suggestions
- warning: Alerts about declining performance or upcoming deadlines (use sparingly)

Tone: Professional military briefing style, but warm and encouraging. Use terms like "operator", "mission", "tactical", "objective", "deployment", etc.`,
      prompt: `Based on this operator's current status, generate a single tactical insight:

${contextParts}

Generate an appropriate insight that will help motivate and guide this operator in their CDS exam preparation.`,
      output: Output.object({ schema: insightSchema }),
      abortSignal: req.signal,
    })

    const insight = result.output

    // Save to database
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('ai_insights')
      .insert({
        user_id: userId,
        insight_type: insight.insight_type,
        content: insight.content,
        is_read: false,
      })
      .select()
      .single()

    if (error) {
      console.error('Error saving insight:', error)
      return Response.json({ error: 'Failed to save insight' }, { status: 500 })
    }

    return Response.json({ insight: data })
  } catch (error) {
    console.error('Error generating insight:', error)
    return Response.json({ error: 'Failed to generate insight' }, { status: 500 })
  }
}
