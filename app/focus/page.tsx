import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { FocusModeClient } from './focus-mode-client'

export default async function FocusPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  return <FocusModeClient userId={user.id} />
}
