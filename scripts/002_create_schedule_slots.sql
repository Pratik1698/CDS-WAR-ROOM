-- Schedule slots table (time-based activity templates)
CREATE TABLE IF NOT EXISTS public.schedule_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  time_label TEXT NOT NULL,
  activity_name TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on schedule_slots
ALTER TABLE public.schedule_slots ENABLE ROW LEVEL SECURITY;

-- RLS policies for schedule_slots
CREATE POLICY "schedule_slots_select_own" ON public.schedule_slots FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "schedule_slots_insert_own" ON public.schedule_slots FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "schedule_slots_update_own" ON public.schedule_slots FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "schedule_slots_delete_own" ON public.schedule_slots FOR DELETE USING (auth.uid() = user_id);

-- Schedule completions table (tracking daily slot completions)
CREATE TABLE IF NOT EXISTS public.schedule_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  slot_id UUID NOT NULL REFERENCES public.schedule_slots(id) ON DELETE CASCADE,
  week_year TEXT NOT NULL,
  day_of_week INTEGER NOT NULL, -- 0 = Monday, 6 = Sunday
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, slot_id, week_year, day_of_week)
);

-- Enable RLS on schedule_completions
ALTER TABLE public.schedule_completions ENABLE ROW LEVEL SECURITY;

-- RLS policies for schedule_completions
CREATE POLICY "schedule_completions_select_own" ON public.schedule_completions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "schedule_completions_insert_own" ON public.schedule_completions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "schedule_completions_update_own" ON public.schedule_completions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "schedule_completions_delete_own" ON public.schedule_completions FOR DELETE USING (auth.uid() = user_id);
