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
    
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        console.log('Initial session:', session)
        
        if (session?.user) {
          setUser(session.user)
          createProfile(session.user)
        } else {
          setUser(null)
          setProfile(null)
        }
      } catch (error) {
        console.error('Error getting initial session:', error)
        setUser(null)
        setProfile(null)
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session)
        
        if (event === 'SIGNED_IN' && session?.user) {
          console.log('User signed in, creating profile...')
          setUser(session.user)
          createProfile(session.user)
        } else if (event === 'SIGNED_OUT' || !session) {
          console.log('User signed out, clearing state')
          setUser(null)
          setProfile(null)
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const createProfile = (user: User) => {
    console.log('Creating profile for user:', user)
    
    try {
      // Determine role based on email for demo purposes
      let role: 'customer' | 'staff' | 'admin' = 'customer'
      if (user.email === 'admin@medrewards.com') {
        role = 'admin'
      } else if (user.email === 'staff@medrewards.com') {
        role = 'staff'
      }
      
      const profile: UserProfile = {
        id: user.id,
        email: user.email || '',
        name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
        phone_number: user.user_metadata?.phone_number || null,
        points_balance: 0,
        role: role,
        clinic_id: null,
        two_factor_enabled: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      console.log('Profile created:', profile)
      setProfile(profile)
    } catch (error) {
      console.error('Error creating profile:', error)
      // Create minimal fallback profile
      setProfile({
        id: user.id,
        email: user.email || 'user@example.com',
        name: 'User',
        phone_number: null,
        points_balance: 0,
        role: 'customer',
        clinic_id: null,
        two_factor_enabled: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (error && error.message === 'Invalid login credentials') {
        return { 
          data, 
          error: { 
            ...error, 
            message: 'Invalid login credentials. For demo accounts, please create them in your Supabase dashboard first (Authentication → Users).' 
          } 
        }
      }
      
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
      console.error('Exception in signUp:', error)
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