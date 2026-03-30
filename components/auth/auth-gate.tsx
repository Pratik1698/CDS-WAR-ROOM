'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Shield, Lock, Mail, User, ArrowRight, AlertCircle } from 'lucide-react'
import { RadarAnimation } from '@/components/war-room/radar-animation'

export function AuthGate() {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccessMessage(null)
    setIsLoading(true)

    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
        window.location.reload()
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ||
              `${window.location.origin}/`,
            data: {
              display_name: displayName || email.split('@')[0],
            },
          },
        })
        if (error) throw error
        setSuccessMessage('Check your email to confirm your account. Then return here to log in.')
        setMode('login')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 scanline">
      {/* Background grid */}
      <div className="fixed inset-0 grid-overlay opacity-20 pointer-events-none" />
      
      <div className="w-full max-w-md relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <RadarAnimation size="lg" />
          </div>
          <div className="flex items-center justify-center gap-2 mb-2">
            <Shield className="w-6 h-6 text-primary" />
            <h1 className="font-mono text-2xl font-bold tracking-wider text-foreground">
              CDS WAR-ROOM
            </h1>
          </div>
          <p className="text-sm font-mono text-muted-foreground">
            TACTICAL PRODUCTIVITY COMMAND CENTER
          </p>
        </div>

        {/* Auth Card */}
        <div className="tactical-border rounded-lg p-6 bg-card/50 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-6">
            <Lock className="w-5 h-5 text-primary" />
            <h2 className="font-mono text-sm font-bold uppercase tracking-wider">
              {mode === 'login' ? 'Authentication Required' : 'Create Operator Account'}
            </h2>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded bg-neon-red/10 border border-neon-red/30 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-neon-red mt-0.5 flex-shrink-0" />
              <p className="text-sm text-neon-red font-mono">{error}</p>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3 rounded bg-neon-green/10 border border-neon-green/30">
              <p className="text-sm text-neon-green font-mono">{successMessage}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono uppercase text-muted-foreground flex items-center gap-1.5">
                  <User className="w-3 h-3" />
                  Callsign (Display Name)
                </label>
                <Input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your callsign..."
                  className="font-mono"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] font-mono uppercase text-muted-foreground flex items-center gap-1.5">
                <Mail className="w-3 h-3" />
                Email Address
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="operator@command.mil"
                required
                className="font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-mono uppercase text-muted-foreground flex items-center gap-1.5">
                <Lock className="w-3 h-3" />
                Access Code
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="font-mono"
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full font-mono uppercase tracking-wider glow-green"
            >
              {isLoading ? (
                'Authenticating...'
              ) : (
                <>
                  {mode === 'login' ? 'Access System' : 'Register Operator'}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t border-border">
            <p className="text-xs font-mono text-muted-foreground text-center">
              {mode === 'login' ? (
                <>
                  New operator?{' '}
                  <button
                    onClick={() => {
                      setMode('signup')
                      setError(null)
                    }}
                    className="text-primary hover:underline"
                  >
                    Register here
                  </button>
                </>
              ) : (
                <>
                  Already registered?{' '}
                  <button
                    onClick={() => {
                      setMode('login')
                      setError(null)
                    }}
                    className="text-primary hover:underline"
                  >
                    Access system
                  </button>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-[10px] font-mono text-muted-foreground/50">
          SECURE CONNECTION ESTABLISHED | ENCRYPTION: AES-256
        </p>
      </div>
    </div>
  )
}
