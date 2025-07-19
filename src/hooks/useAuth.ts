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
    console.log('useAuth: Starting auth check')
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('useAuth: Initial session check', session?.user?.id)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        console.log('useAuth: No session, setting loading to false')
        setLoading(false)
      }
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        console.log('useAuth: Auth state changed', _event, session?.user?.id)
        setUser(session?.user ?? null)
        if (session?.user) {
          await fetchProfile(session.user.id)
        } else {
          setProfile(null)
          console.log('useAuth: Auth state change - no session, setting loading to false')
          setLoading(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const fetchProfile = async (userId: string) => {
    console.log('useAuth: Fetching profile for user', userId)
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('useAuth: Error fetching profile:', error.code, error.message)
        // If profile doesn't exist, create one
        if (error.code === 'PGRST116') {
          console.log('useAuth: Profile not found, creating new profile')
          const { data: userData } = await supabase.auth.getUser()
          if (userData.user) {
            console.log('useAuth: Creating profile for user', userData.user.id)
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
              console.log('useAuth: Profile created successfully', newProfile.id)
              setProfile(newProfile)
              setLoading(false)
              return
            } else {
              console.error('useAuth: Error creating profile:', insertError)
            }
          }
        }
        console.error('useAuth: Profile fetch failed, setting loading to false')
        setProfile(null)
        setLoading(false)
        return
      }
      console.log('useAuth: Profile fetched successfully', data.id)
      setProfile(data)
    } catch (error) {
      console.error('useAuth: Catch block - Error fetching profile:', error)
      setProfile(null)
    } finally {
      console.log('useAuth: Setting loading to false')
      setLoading(false)
    }
  }

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { data, error }
  }

  const signUp = async (email: string, password: string, name: string, phone?: string) => {
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
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
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