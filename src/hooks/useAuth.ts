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

    const initAuth = async () => {
      try {
        console.log('Starting auth initialization...')
        
        // Set a timeout to prevent infinite loading
        const timeoutId = setTimeout(() => {
          if (mounted) {
            console.log('Auth timeout - setting loading to false')
            setLoading(false)
          }
        }, 5000)

        // Get initial session
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Session error:', error)
          clearTimeout(timeoutId)
          if (mounted) setLoading(false)
          return
        }

        console.log('Session check complete:', session?.user?.id || 'No session')
        
        if (session?.user && mounted) {
          setUser(session.user)
          await fetchProfile(session.user.id)
        }
        
        clearTimeout(timeoutId)
        if (mounted) setLoading(false)

      } catch (error) {
        console.error('Auth initialization error:', error)
        if (mounted) setLoading(false)
      }
    }

    initAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id || 'No session')
        
        if (!mounted) return

        setUser(session?.user ?? null)
        
        if (session?.user) {
          await fetchProfile(session.user.id)
        } else {
          setProfile(null)
        }
        
        setLoading(false)
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const fetchProfile = async (userId: string) => {
    try {
      console.log('Fetching profile for:', userId)
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Profile fetch error:', error.code, error.message)
        
        // If profile doesn't exist, try to create one
        if (error.code === 'PGRST116') {
          console.log('Creating new profile...')
          const { data: userData } = await supabase.auth.getUser()
          
          if (userData.user) {
            const { data: newProfile, error: insertError } = await supabase
              .from('users')
              .insert({
                id: userData.user.id,
                email: userData.user.email || '',
                name: userData.user.user_metadata?.name || userData.user.email?.split('@')[0] || 'User',
                phone_number: userData.user.user_metadata?.phone_number || null,
                role: 'customer'
              })
              .select()
              .single()
            
            if (!insertError && newProfile) {
              console.log('Profile created successfully')
              setProfile(newProfile)
              return
            } else {
              console.error('Profile creation error:', insertError)
            }
          }
        }
        
        setProfile(null)
        return
      }

      console.log('Profile fetched successfully')
      setProfile(data)
    } catch (error) {
      console.error('Profile fetch catch error:', error)
      setProfile(null)
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      console.log('Starting sign in process...')
      setLoading(true)
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      console.log('Sign in response:', { data: !!data, error: !!error })
      
      if (error) {
        console.error('Sign in error:', error)
        setLoading(false)
        return { data, error }
      }
      
      // Don't set loading to false here - let the auth state change handler do it
      return { data, error }
    } catch (error) {
      console.error('Sign in error:', error)
      setLoading(false)
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

      // Check if user needs email confirmation
      if (data.user && !data.session) {
        return { 
          data, 
          error: null,
          message: 'Please check your email to confirm your account before signing in.'
        }
      }

      return { data, error }
    } catch (error) {
      console.error('Sign up error:', error)
      return { data: null, error }
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      return { error }
    } catch (error) {
      console.error('Sign out error:', error)
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