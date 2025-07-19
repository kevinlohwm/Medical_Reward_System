import { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { Database } from '../types/database'

type UserProfile = Database['public']['Tables']['users']['Row']

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    console.log('Auth hook initializing...')
    
    // Set a maximum loading time of 2 seconds
    const loadingTimeout = setTimeout(() => {
      console.log('Loading timeout reached, setting loading to false')
      setLoading(false)
    }, 2000)

    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        console.log('Initial session:', session)
        
        if (session?.user) {
          setUser(session.user)
          await loadProfile(session.user.id)
        }
      } catch (error) {
        console.error('Error getting initial session:', error)
      } finally {
        clearTimeout(loadingTimeout)
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session)
        
        if (session?.user) {
          console.log('User authenticated, loading profile...')
          setUser(session.user)
          await loadProfile(session.user.id)
        } else {
          console.log('No user session, clearing state')
          setUser(null)
          setProfile(null)
        }
        console.log('Setting loading to false after auth state change')
        setLoading(false)
      }
    )

    return () => {
      clearTimeout(loadingTimeout)
      subscription.unsubscribe()
    }
  }, [])

  const loadProfile = async (userId: string) => {
    console.log('Loading profile for user:', userId)
    
    // Get user info from current auth session
    const { data: { user } } = await supabase.auth.getUser()
    console.log('Current auth user:', user)
    
    // Create profile directly from auth user data
    const profile: UserProfile = {
      id: userId,
      email: user?.email || '',
      name: user?.user_metadata?.name || user?.email?.split('@')[0] || 'User',
      phone_number: user?.user_metadata?.phone_number || null,
      points_balance: 0,
      role: 'customer',
      clinic_id: null,
      two_factor_enabled: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    console.log('Created profile from auth data:', profile)
    setProfile(profile)
  }

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      return { data, error }
    } catch (error) {
      console.error('Sign in exception:', error)
      return { error }
    }
  }

  const signUp = async (email: string, password: string, name: string, phone?: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            phone_number: phone,
          }
        }
      })

      if (error) {
        return { data, error }
      }

      if (data.user && !data.session) {
        return { 
          data, 
          error: null,
          message: 'Please check your email to confirm your account before signing in.'
        }
      }

      return { data, error }
    } catch (error) {
      console.error('Exception in signIn:', error)
      return { data: null, error }
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (!error) {
        setUser(null)
        setProfile(null)
      }
      return { error }
    } catch (error) {
      return { error }
    }
  }

  return {
    user,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
  }
}