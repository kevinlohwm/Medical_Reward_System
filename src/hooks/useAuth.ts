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
    let mounted = true
    
    // Force loading to false after 3 seconds maximum
    const forceLoadingTimeout = setTimeout(() => {
      if (mounted) {
        console.log('Force setting loading to false after timeout')
        setLoading(false)
      }
    }, 3000)
    
    const initAuth = async () => {
      try {
        console.log('Initializing auth...')
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Error getting session:', error)
          if (mounted) {
            setLoading(false)
          }
          return
        }
        
        console.log('Session:', session)
        
        if (session?.user && mounted) {
          setUser(session.user)
          await loadUserProfile(session.user.id)
        } else if (mounted) {
          setLoading(false)
        }
      } catch (error) {
        console.error('Error in initAuth:', error)
        if (mounted) {
          setLoading(false)
        }
      }
    }
    
    initAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session)
        
        if (!mounted) return
        
        if (session?.user) {
          setUser(session.user)
          await loadUserProfile(session.user.id)
        } else {
          setUser(null)
          setProfile(null)
          setLoading(false)
        }
      }
    )

    return () => {
      mounted = false
      clearTimeout(forceLoadingTimeout)
      subscription.unsubscribe()
    }
  }, [])

  const loadUserProfile = async (userId: string) => {
    try {
      console.log('Loading user profile for:', userId)
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error loading profile:', error)
        // If profile doesn't exist, create a basic one
        if (error.code === 'PGRST116') {
          console.log('Profile not found, creating basic profile')
          const basicProfile: UserProfile = {
            id: userId,
            email: user?.email || '',
            name: user?.user_metadata?.name || user?.email?.split('@')[0] || 'User',
            phone_number: null,
            points_balance: 0,
            role: 'customer',
            clinic_id: null,
            two_factor_enabled: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
          setProfile(basicProfile)
        }
        setLoading(false)
        return
      }

      console.log('Profile loaded:', data)
      setProfile(data)
      setLoading(false)
    } catch (error) {
      console.error('Error in loadUserProfile:', error)
      setLoading(false)
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      console.log('Attempting sign in for:', email)
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      console.log('Sign in result:', { data, error })
      return { data, error }
    } catch (error) {
      console.error('Error in signIn:', error)
      return { data: null, error }
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
      return { data: null, error }
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
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