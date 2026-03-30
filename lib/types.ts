export interface Profile {
  id: string
  display_name: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface Mission {
  id: string
  user_id: string
  title: string
  description: string | null
  status: 'active' | 'completed' | 'archived'
  priority: 'low' | 'medium' | 'high' | 'critical'
  target_date: string | null
  created_at: string
  updated_at: string
}

export interface Progress {
  id: string
  user_id: string
  mission_id: string | null
  date: string
  hours_studied: number
  tasks_completed: number
  notes: string | null
  created_at: string
}

export interface WeeklyStats {
  id: string
  user_id: string
  week_start: string
  total_hours: number
  total_tasks: number
  missions_completed: number
  streak_days: number
  created_at: string
}

export interface AIInsight {
  id: string
  user_id: string
  insight_type: 'motivation' | 'analysis' | 'recommendation' | 'warning'
  content: string
  is_read: boolean
  created_at: string
}

export interface DayActivity {
  date: string
  hours: number
  level: 0 | 1 | 2 | 3 | 4
}

export interface WeekData {
  days: DayActivity[]
  weekLabel: string
}

export interface ScheduleSlot {
  id: string
  user_id: string
  time_label: string
  activity_name: string
  sort_order: number
  created_at: string
}

export interface ScheduleCompletion {
  id: string
  user_id: string
  slot_id: string
  week_year: string
  day_of_week: number
  completed: boolean
  created_at: string
}
