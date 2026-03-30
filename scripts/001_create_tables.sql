-- CDS WAR-ROOM Database Schema

-- Users profile table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT,
  rank TEXT DEFAULT 'Cadet',
  xp INTEGER DEFAULT 0,
  streak INTEGER DEFAULT 0,
  exam_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS policies for profiles
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_delete_own" ON public.profiles FOR DELETE USING (auth.uid() = id);

-- Missions table (task templates)
CREATE TABLE IF NOT EXISTS public.missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  time TEXT,
  category TEXT,
  day_of_week INTEGER, -- 0 = Monday, 6 = Sunday
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on missions
ALTER TABLE public.missions ENABLE ROW LEVEL SECURITY;

-- RLS policies for missions
CREATE POLICY "missions_select_own" ON public.missions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "missions_insert_own" ON public.missions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "missions_update_own" ON public.missions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "missions_delete_own" ON public.missions FOR DELETE USING (auth.uid() = user_id);

-- Progress table (daily completion tracking)
CREATE TABLE IF NOT EXISTS public.progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mission_id UUID REFERENCES public.missions(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  duration INTEGER DEFAULT 0,
  notes TEXT,
  mood TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, mission_id, date)
);

-- Enable RLS on progress
ALTER TABLE public.progress ENABLE ROW LEVEL SECURITY;

-- RLS policies for progress
CREATE POLICY "progress_select_own" ON public.progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "progress_insert_own" ON public.progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "progress_update_own" ON public.progress FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "progress_delete_own" ON public.progress FOR DELETE USING (auth.uid() = user_id);

-- Weekly stats table
CREATE TABLE IF NOT EXISTS public.weekly_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  completion_percentage DECIMAL(5,2) DEFAULT 0,
  readiness_score DECIMAL(5,2) DEFAULT 0,
  total_hours DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, week_start)
);

-- Enable RLS on weekly_stats
ALTER TABLE public.weekly_stats ENABLE ROW LEVEL SECURITY;

-- RLS policies for weekly_stats
CREATE POLICY "weekly_stats_select_own" ON public.weekly_stats FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "weekly_stats_insert_own" ON public.weekly_stats FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "weekly_stats_update_own" ON public.weekly_stats FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "weekly_stats_delete_own" ON public.weekly_stats FOR DELETE USING (auth.uid() = user_id);

-- AI insights table
CREATE TABLE IF NOT EXISTS public.ai_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  insight_type TEXT NOT NULL,
  weak_area TEXT,
  recommendation TEXT,
  data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on ai_insights
ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;

-- RLS policies for ai_insights
CREATE POLICY "ai_insights_select_own" ON public.ai_insights FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "ai_insights_insert_own" ON public.ai_insights FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "ai_insights_update_own" ON public.ai_insights FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "ai_insights_delete_own" ON public.ai_insights FOR DELETE USING (auth.uid() = user_id);

-- Function to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'name', NULL),
    NEW.email
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Trigger to create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
