import { createClient } from '@/lib/supabase/server'
import { WarRoomDashboard } from '@/components/war-room/war-room-dashboard'
import { AuthGate } from '@/components/auth/auth-gate'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return <AuthGate />
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', user.id)
    .single()

  return (
    <WarRoomDashboard 
      userId={user.id}
      displayName={profile?.display_name || user.email?.split('@')[0] || 'Operator'}
    />
  )
}
